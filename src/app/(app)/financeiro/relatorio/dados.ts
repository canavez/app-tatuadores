import { createClient } from "@/lib/supabase/server";
import { hoje, partesLocais } from "@/lib/agenda";
import { buscarConfiguracoes } from "@/lib/configuracoes";
import { CATEGORIAS, FORMAS, saldoSessao, somar, type Categoria, type Forma } from "@/lib/financeiro";
import { mesCurto, type Periodo } from "@/lib/relatorio";

export type Barra = { rotulo: string; valor: number };
export type PontoSerie = { rotulo: string; recebido: number; custos: number; lucro: number };

type PagamentoRel = {
  valor: number;
  taxa: number;
  data: string;
  tipo: string;
  forma: Forma;
  sessao: { tatuagem: { cliente: { id: string; nome: string } } };
};

/** Tudo o que o relatório mostra, já calculado para o período. */
export async function montarRelatorio(periodo: Periodo) {
  const supabase = await createClient();
  const de = `${periodo.inicio}-01`;
  const ate = periodo.fimExclusivo;

  const [pag, desp, ses, abertas, config, usuario] = await Promise.all([
    supabase
      .from("pagamentos")
      .select("valor, taxa, data, tipo, forma, sessao:sessoes!inner(tatuagem:tatuagens!inner(cliente:clientes!inner(id, nome)))")
      .gte("data", de)
      .lt("data", ate),
    supabase.from("despesas").select("valor, data, categoria").gte("data", de).lt("data", ate),
    supabase
      .from("sessoes")
      .select("inicio, status, valor")
      .gte("inicio", `${de}T00:00:00-03:00`)
      .lt("inicio", `${ate}T00:00:00-03:00`),
    supabase
      .from("sessoes")
      .select("valor, status, pagamentos(valor)")
      .not("valor", "is", null)
      .not("status", "in", "(cancelado,faltou)"),
    buscarConfiguracoes(),
    supabase.auth.getUser(),
  ]);

  const pagamentos = (pag.data ?? []) as unknown as PagamentoRel[];
  const despesas = (desp.data ?? []) as { valor: number; data: string; categoria: Categoria }[];
  const sessoes = (ses.data ?? []) as { inicio: string; status: string; valor: number | null }[];
  const proprio = config.modelo === "proprio";
  const mesAtual = hoje().slice(0, 7);

  // Custo do estúdio de um mês: comissão sobre o recebido, ou contas fixas (só de meses que já começaram).
  const custoEstudio = (mes: string, recebidoNoMes: number) =>
    proprio
      ? mes <= mesAtual
        ? Number(config.contas_fixas)
        : 0
      : Math.round(recebidoNoMes * Number(config.comissao_estudio)) / 100;

  const porMes = periodo.meses.map((mes) => {
    const p = pagamentos.filter((x) => x.data.startsWith(mes));
    const recebido = somar(p.map((x) => x.valor));
    const taxas = somar(p.map((x) => x.taxa));
    const despesasMes = somar(despesas.filter((x) => x.data.startsWith(mes)).map((x) => x.valor));
    const estudio = custoEstudio(mes, recebido);
    const custos = somar([taxas, despesasMes, estudio]);
    return { mes, recebido, taxas, despesas: despesasMes, estudio, custos, lucro: somar([recebido, -custos]) };
  });

  const recebido = somar(porMes.map((m) => m.recebido));
  const taxas = somar(porMes.map((m) => m.taxas));
  const totalDespesas = somar(porMes.map((m) => m.despesas));
  const estudio = somar(porMes.map((m) => m.estudio));
  const custos = somar([taxas, totalDespesas, estudio]);
  const lucro = somar([recebido, -custos]);

  // Série do gráfico: semanas (período de um mês) ou meses.
  let serie: PontoSerie[];
  if (periodo.tipo === "mes") {
    const faixas: [number, number][] = [[1, 7], [8, 14], [15, 21], [22, 28], [29, 31]];
    serie = faixas.map(([a, b], i) => {
      const dentro = (data: string) => {
        const d = Number(data.slice(8, 10));
        return d >= a && d <= b;
      };
      const rec = somar(pagamentos.filter((x) => dentro(x.data)).map((x) => x.valor));
      const cus = somar([
        ...pagamentos.filter((x) => dentro(x.data)).map((x) => x.taxa),
        ...despesas.filter((x) => dentro(x.data)).map((x) => x.valor),
      ]);
      return { rotulo: `Sem ${i + 1}`, recebido: rec, custos: cus, lucro: somar([rec, -cus]) };
    });
  } else {
    serie = porMes.map((m) => ({ rotulo: mesCurto(m.mes), recebido: m.recebido, custos: m.custos, lucro: m.lucro }));
  }

  const porForma: Barra[] = (Object.keys(FORMAS) as Forma[])
    .map((f) => ({ rotulo: FORMAS[f], valor: somar(pagamentos.filter((p) => p.forma === f).map((p) => p.valor)) }))
    .filter((b) => b.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const custosPorTipo: Barra[] = [
    { rotulo: "Taxas da maquininha", valor: taxas },
    { rotulo: proprio ? "Contas fixas" : `Comissão do estúdio (${String(Number(config.comissao_estudio)).replace(".", ",")}%)`, valor: estudio },
    ...(Object.keys(CATEGORIAS) as Categoria[]).map((c) => ({
      rotulo: CATEGORIAS[c],
      valor: somar(despesas.filter((d) => d.categoria === c).map((d) => d.valor)),
    })),
  ]
    .filter((b) => b.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const porCliente = new Map<string, { rotulo: string; valor: number }>();
  for (const p of pagamentos) {
    const c = p.sessao.tatuagem.cliente;
    const atual = porCliente.get(c.id) ?? { rotulo: c.nome, valor: 0 };
    atual.valor = somar([atual.valor, p.valor]);
    porCliente.set(c.id, atual);
  }
  const topClientes = [...porCliente.values()].sort((a, b) => b.valor - a.valor).slice(0, 5);

  const realizadas = sessoes.filter((s) => s.status === "realizado");
  const contagem = {
    realizadas: realizadas.length,
    faltas: sessoes.filter((s) => s.status === "faltou").length,
    canceladas: sessoes.filter((s) => s.status === "cancelado").length,
    marcadas: sessoes.filter((s) => s.status === "agendado" || s.status === "confirmado").length,
  };
  const ticketMedio = realizadas.length ? somar(realizadas.map((s) => s.valor)) / realizadas.length : 0;
  const aReceber = somar(
    ((abertas.data ?? []) as { valor: number; status: string; pagamentos: { valor: number }[] }[]).map(
      (s) => saldoSessao(s).falta,
    ),
  );

  const nomeTatuador = (usuario.data.user?.user_metadata?.nome as string | undefined) ?? usuario.data.user?.email ?? "";

  return {
    recebido,
    sinais: somar(pagamentos.filter((p) => p.tipo === "sinal").map((p) => p.valor)),
    taxas,
    despesas: totalDespesas,
    estudio,
    custos,
    lucro,
    margem: recebido > 0 ? (lucro / recebido) * 100 : 0,
    porMes,
    serie,
    porForma,
    custosPorTipo,
    topClientes,
    contagem,
    ticketMedio,
    aReceber,
    nomeTatuador,
    geradoEm: partesLocais(new Date()),
    proprio,
    erro: pag.error || desp.error || ses.error,
  };
}
