"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoje, paraInstante, somarDias } from "@/lib/agenda";

// Tudo o que é criado aqui começa com este prefixo, para dar para apagar depois.
const PREFIXO_EXEMPLO = "Exemplo · ";

const NOMES = [
  "Ana Lima", "Bruno Costa", "Carla Mendes", "Diego Rocha", "Elisa Prado", "Felipe Nunes",
  "Gabi Torres", "Heitor Alves", "Iara Souza", "João Pires", "Karen Dias", "Léo Martins",
];
const TATUAGENS = [
  ["Rosa fineline", "antebraço"], ["Leão realista", "costas"], ["Mandala", "coxa"], ["Lettering", "costela"],
  ["Borboleta", "tornozelo"], ["Fechamento de braço", "braço"], ["Serpente", "perna"], ["Lua e estrelas", "nuca"],
  ["Retrato", "panturrilha"], ["Geométrica", "ombro"], ["Ondas", "punho"], ["Caveira", "mão"],
];
const DESPESAS: [string, string, number, number][] = [
  ["Aluguel do espaço", "aluguel", 1100, 1400],
  ["Tintas", "material", 180, 520],
  ["Cartuchos e agulhas", "material", 150, 450],
  ["Luvas, filme e descartáveis", "material", 90, 220],
  ["Anúncio no Instagram", "divulgacao", 80, 300],
  ["Manutenção da máquina", "equipamento", 120, 400],
  ["Café e água do estúdio", "outros", 40, 120],
];

/** Números "aleatórios" previsíveis (o mesmo resultado a cada geração). */
function sorteador(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export async function gerarDadosExemplo() {
  if (process.env.NODE_ENV === "production") return;
  const supabase = await createClient();
  const sorte = sorteador(42);
  const entre = (min: number, max: number) => Math.round(min + sorte() * (max - min));
  const umDe = <T,>(lista: T[]) => lista[Math.floor(sorte() * lista.length)];
  const dia = hoje();
  const mesAtual = dia.slice(0, 7);

  // Clientes
  const { data: clientes } = await supabase
    .from("clientes")
    .insert(NOMES.map((n) => ({ nome: `${PREFIXO_EXEMPLO}${n}`, telefone: `1199${entre(1000000, 9999999)}` })))
    .select("id");
  if (!clientes) return;

  // Horários já ocupados na agenda (para não dar conflito).
  const inicioJanela = `${somarDias(`${mesAtual}-01`, -150).slice(0, 7)}-01`;
  const fimJanela = somarDias(dia, 21);
  const { data: existentes } = await supabase
    .from("sessoes")
    .select("inicio, fim")
    .gte("inicio", paraInstante(inicioJanela, "00:00"))
    .lt("inicio", paraInstante(fimJanela, "23:59"));
  const ocupado = (existentes ?? []).map((s) => [new Date(s.inicio).getTime(), new Date(s.fim).getTime()]);
  const livre = (ini: number, fim: number) => !ocupado.some(([a, b]) => ini < b && fim > a);

  // Sessões: de 5 meses atrás até 3 semanas para a frente, de terça a sábado.
  type Plano = { cliente: string; data: string; hora: string; duracao: number; valor: number };
  const planos: Plano[] = [];
  for (let d = inicioJanela; d <= fimJanela; d = somarDias(d, 1)) {
    const semana = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (semana === 0 || semana === 1) continue;
    for (const hora of ["10:00", "15:00"]) {
      if (sorte() > 0.42) continue;
      const duracao = umDe([2, 3, 3, 4]);
      const ini = new Date(paraInstante(d, hora)).getTime();
      const fim = ini + duracao * 3600_000;
      if (!livre(ini, fim)) continue;
      ocupado.push([ini, fim]);
      planos.push({ cliente: umDe(clientes).id, data: d, hora, duracao, valor: entre(6, 50) * 50 });
    }
  }

  // Uma tatuagem por sessão (com a descrição sorteada).
  const { data: tatuagens } = await supabase
    .from("tatuagens")
    .insert(planos.map((p) => {
      const [descricao, local] = umDe(TATUAGENS);
      return { cliente_id: p.cliente, descricao, local_corpo: local };
    }))
    .select("id");
  if (!tatuagens) return;

  const passada = (p: Plano) => p.data < dia;
  const status = planos.map((p) => {
    if (passada(p)) {
      const r = sorte();
      return r < 0.08 ? "faltou" : r < 0.13 ? "cancelado" : "realizado";
    }
    return sorte() < 0.6 ? "confirmado" : "agendado";
  });

  const { data: sessoes } = await supabase
    .from("sessoes")
    .insert(planos.map((p, i) => {
      const fim = new Date(new Date(paraInstante(p.data, p.hora)).getTime() + p.duracao * 3600_000);
      return {
        tatuagem_id: tatuagens[i].id,
        inicio: paraInstante(p.data, p.hora),
        fim: fim.toISOString(),
        status: status[i],
        valor: p.valor,
        observacoes: null,
      };
    }))
    .select("id");
  if (!sessoes) return;

  // Pagamentos: sinal de 30% uma semana antes (Pix) e o restante no dia, em várias formas.
  const TAXA = { pix: 0, dinheiro: 0, debito: 1.99, credito: 4.99 } as const;
  const pagamentos: Record<string, unknown>[] = [];
  planos.forEach((p, i) => {
    const st = status[i];
    const sinal = Math.round(p.valor * 0.3);
    const dataSinal = somarDias(p.data, -entre(3, 10));
    const temSinal = st !== "agendado" && !(st === "cancelado" && sorte() < 0.5);
    if (temSinal && dataSinal <= dia) {
      pagamentos.push({ sessao_id: sessoes[i].id, valor: sinal, taxa: 0, data: dataSinal, tipo: "sinal", forma: "pix" });
    }
    if (st === "realizado") {
      const forma = umDe(["pix", "pix", "dinheiro", "debito", "credito", "credito"] as const);
      const resto = p.valor - (temSinal ? sinal : 0);
      pagamentos.push({
        sessao_id: sessoes[i].id,
        valor: resto,
        taxa: Math.round(resto * TAXA[forma]) / 100,
        data: p.data,
        tipo: "pagamento",
        forma,
      });
    }
  });
  if (pagamentos.length > 0) await supabase.from("pagamentos").insert(pagamentos);

  // Despesas: algumas por mês, até hoje.
  const despesas: Record<string, unknown>[] = [];
  for (let m = 0; m < 6; m++) {
    const base = new Date(`${inicioJanela}T12:00:00Z`);
    base.setUTCMonth(base.getUTCMonth() + m);
    const mesAlvo = base.toISOString().slice(0, 7);
    for (const [descricao, categoria, min, max] of DESPESAS) {
      if (categoria === "equipamento" && sorte() < 0.6) continue;
      const data = `${mesAlvo}-${String(entre(2, 27)).padStart(2, "0")}`;
      if (data > dia) continue;
      despesas.push({ descricao: `${PREFIXO_EXEMPLO}${descricao}`, valor: entre(min, max), data, categoria });
    }
  }
  if (despesas.length > 0) await supabase.from("despesas").insert(despesas);

  revalidatePath("/", "layout");
  redirect("/conta?exemplo=gerado");
}

export async function apagarDadosExemplo() {
  if (process.env.NODE_ENV === "production") return;
  const supabase = await createClient();
  // Apagar os clientes leva junto tatuagens, sessões e pagamentos.
  await supabase.from("clientes").delete().like("nome", `${PREFIXO_EXEMPLO}%`);
  await supabase.from("despesas").delete().like("descricao", `${PREFIXO_EXEMPLO}%`);
  revalidatePath("/", "layout");
  redirect("/conta?exemplo=apagado");
}
