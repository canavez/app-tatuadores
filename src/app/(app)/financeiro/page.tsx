import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoje, mesAno, partesLocais } from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import {
  CATEGORIAS,
  FORMAS,
  TIPOS,
  reais,
  saldoSessao,
  somar,
  type Categoria,
  type Pagamento,
} from "@/lib/financeiro";
import { buscarConfiguracoes } from "@/lib/configuracoes";
import { BotaoExcluir } from "@/components/botao-excluir";
import { excluirDespesa } from "./actions";
import { BotaoIcone, Topo } from "@/components/topo";

type PagamentoDoMes = Pagamento & {
  sessao: { id: string; tatuagem: { descricao: string; cliente: { nome: string } } };
};

type Despesa = { id: string; descricao: string; valor: number; data: string; categoria: Categoria };

type SessaoAReceber = {
  id: string;
  inicio: string;
  status: string;
  valor: number;
  pagamentos: { valor: number }[];
  tatuagem: { descricao: string; cliente: { nome: string } };
};

/** "2026-10" + 1 → "2026-11" */
function somarMeses(mes: string, n: number): string {
  const d = new Date(`${mes}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

export default async function FinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  const { mes: mesParam, aba: abaParam } = await searchParams;
  const aba = abaParam === "despesas" || abaParam === "areceber" ? abaParam : "recebidos";
  const mesAtual = hoje().slice(0, 7);
  const mes = typeof mesParam === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : mesAtual;

  const supabase = await createClient();
  const [doMes, abertas, despesasDoMes, config] = await Promise.all([
    supabase
      .from("pagamentos")
      .select(
        "id, sessao_id, valor, taxa, data, tipo, forma, observacoes, " +
          "sessao:sessoes!inner(id, tatuagem:tatuagens!inner(descricao, cliente:clientes!inner(nome)))",
      )
      .gte("data", `${mes}-01`)
      .lt("data", `${somarMeses(mes, 1)}-01`)
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false }),
    supabase
      .from("sessoes")
      .select(
        "id, inicio, status, valor, pagamentos(valor), " +
          "tatuagem:tatuagens!inner(descricao, cliente:clientes!inner(nome))",
      )
      .not("valor", "is", null)
      .not("status", "in", "(cancelado,faltou)")
      .order("inicio"),
    supabase
      .from("despesas")
      .select("id, descricao, valor, data, categoria")
      .gte("data", `${mes}-01`)
      .lt("data", `${somarMeses(mes, 1)}-01`)
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false }),
    buscarConfiguracoes(),
  ]);

  const pagamentos = (doMes.data ?? []) as unknown as PagamentoDoMes[];
  const recebido = somar(pagamentos.map((p) => p.valor));
  const sinais = somar(pagamentos.filter((p) => p.tipo === "sinal").map((p) => p.valor));
  const taxas = somar(pagamentos.map((p) => p.taxa));
  const proprio = config.modelo === "proprio";
  // Estúdio de outra pessoa: comissão sobre o recebido. Estúdio próprio: contas fixas do mês.
  const custoEstudio = proprio
    ? Number(config.contas_fixas)
    : Math.round(recebido * Number(config.comissao_estudio)) / 100;
  const despesas = (despesasDoMes.data ?? []) as Despesa[];
  const totalDespesas = somar(despesas.map((d) => d.valor));
  const lucro = somar([recebido, -taxas, -custoEstudio, -totalDespesas]);
  const percentualComissao = String(Number(config.comissao_estudio)).replace(".", ",");
  const semConfiguracao =
    Number(config.taxa_credito) +
      Number(config.taxa_debito) +
      Number(proprio ? config.contas_fixas : config.comissao_estudio) ===
    0;

  const aReceber = ((abertas.data ?? []) as unknown as SessaoAReceber[])
    .map((s) => ({ ...s, falta: saldoSessao(s).falta ?? 0 }))
    .filter((s) => s.falta > 0);
  const totalAReceber = somar(aReceber.map((s) => s.falta));

  const porForma = Object.entries(FORMAS)
    .map(([forma, rotulo]) => ({
      forma,
      rotulo,
      total: somar(pagamentos.filter((p) => p.forma === forma).map((p) => p.valor)),
    }))
    .filter((f) => f.total > 0);

  const erro = doMes.error || abertas.error || despesasDoMes.error;
  const custos = [
    { rotulo: "Taxas da maquininha", valor: taxas },
    {
      rotulo: proprio ? "Contas fixas" : `Comissão do estúdio (${percentualComissao}%)`,
      valor: custoEstudio,
    },
    { rotulo: "Despesas", valor: totalDespesas },
  ].filter((c) => c.valor > 0);
  const urlAba = (nova: string) =>
    `/financeiro?${new URLSearchParams({ ...(mes !== mesAtual ? { mes } : {}), ...(nova !== "recebidos" ? { aba: nova } : {}) })}`;

  return (
    <>
      <Topo
        titulo="Financeiro"
        acoes={
          <>
            {mes !== mesAtual && (
              <Link href="/financeiro" className="botao-secundario py-1.5">
                Mês atual
              </Link>
            )}
            <BotaoIcone href="/financeiro/configuracoes" rotulo="Taxas e custos">
              <Settings className="size-5" />
            </BotaoIcone>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/financeiro?mes=${somarMeses(mes, -1)}`}
            aria-label="Mês anterior"
            className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h2 className="font-semibold first-letter:uppercase">{mesAno(`${mes}-01`)}</h2>
          <Link
            href={`/financeiro?mes=${somarMeses(mes, 1)}`}
            aria-label="Próximo mês"
            className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>

        {erro && <p className="aviso-erro">Erro ao carregar o financeiro.</p>}

        {/* Lucro do mês em destaque */}
        <section
          aria-label="Resultado do mês"
          className="flex flex-col gap-2 rounded-2xl border border-accent/30 bg-surface-alto/40 p-4 text-sm"
        >
          <h2 className="text-xs font-medium text-lavanda">Lucro do mês</h2>
          <p
            className={`text-3xl font-semibold tabular-nums ${lucro < 0 ? "text-red-400" : "text-green-400"}`}
          >
            {reais(lucro)}
          </p>
          <Linha rotulo="Recebido" valor={recebido} />
          {sinais > 0 && <p className="-mt-1 text-xs text-muted tabular-nums">{reais(sinais)} em sinais</p>}
          {custos.length === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-muted">Custos</span>
              <span className="text-muted">nenhum registrado</span>
            </div>
          ) : (
            custos.map((c) => <Linha key={c.rotulo} rotulo={c.rotulo} valor={-c.valor} />)
          )}

          {porForma.length > 0 && (
            <>
              <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                {porForma.map((f) => (
                  <div key={f.forma} className={COR_FORMA[f.forma]} style={{ width: `${(f.total / recebido) * 100}%` }} />
                ))}
              </div>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
                {porForma.map((f) => (
                  <span key={f.forma} className="flex items-center gap-1">
                    <span className={`size-2 rounded-full ${COR_FORMA[f.forma]}`} />
                    {f.rotulo} {reais(f.total)}
                  </span>
                ))}
              </p>
            </>
          )}

          {semConfiguracao && (
            <p className="text-xs text-muted">
              Configure as taxas da maquininha e os custos do estúdio em{" "}
              <Link href="/financeiro/configuracoes" className="underline">
                Taxas e custos
              </Link>
              .
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link href={urlAba("areceber")} className="card active:scale-[0.99]">
            <p className="text-xs text-muted">A receber</p>
            <p className="text-lg font-semibold tabular-nums text-amber-400">{reais(totalAReceber)}</p>
            <p className="text-xs text-muted">
              {aReceber.length} {aReceber.length === 1 ? "sessão" : "sessões"}
            </p>
          </Link>
          <Link href={urlAba("despesas")} className="card active:scale-[0.99]">
            <p className="text-xs text-muted">Despesas</p>
            <p className="text-lg font-semibold tabular-nums">{reais(totalDespesas)}</p>
            <p className="text-xs text-muted">neste mês</p>
          </Link>
        </div>

        {/* Abas */}
        <nav aria-label="Listas do financeiro" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
          {(
            [
              ["recebidos", "Recebidos"],
              ["despesas", "Despesas"],
              ["areceber", "A receber"],
            ] as const
          ).map(([valor, rotulo]) => (
            <Link
              key={valor}
              href={urlAba(valor)}
              aria-current={aba === valor ? "page" : undefined}
              className={`rounded-lg py-2 text-center transition ${aba === valor ? "bg-surface-alto font-medium text-lavanda" : "text-muted hover:text-foreground"}`}
            >
              {rotulo}
            </Link>
          ))}
        </nav>

        {aba === "recebidos" &&
          (pagamentos.length === 0 ? (
            <div className="card py-8 text-center text-sm text-muted">Nenhum pagamento neste mês.</div>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {pagamentos.map((p) => (
                <li key={p.id}>
                  <Link href={`/agenda/${p.sessao.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-background">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.sessao.tatuagem.cliente.nome}</span>
                      <span className="block truncate text-sm text-muted">
                        {formatarData(p.data).slice(0, 5)} · {TIPOS[p.tipo]} · {FORMAS[p.forma]}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{reais(Number(p.valor))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}

        {aba === "despesas" && (
          <>
            <Link href={`/financeiro/despesas/nova?mes=${mes}`} className="botao-secundario gap-2 py-2.5">
              <Plus className="size-4" />
              Nova despesa
            </Link>
            {despesas.length === 0 ? (
              <div className="card py-8 text-center text-sm text-muted">Nenhuma despesa neste mês.</div>
            ) : (
              <ul className="card divide-y divide-border p-0">
                {despesas.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{d.descricao}</span>
                      <span className="block text-sm text-muted">
                        {formatarData(d.data).slice(0, 5)} · {CATEGORIAS[d.categoria]}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{reais(Number(d.valor))}</span>
                    <BotaoExcluir
                      acao={excluirDespesa.bind(null, d.id, mes)}
                      rotulo="Excluir"
                      confirmacao={`Excluir a despesa "${d.descricao}"?`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {aba === "areceber" &&
          (aReceber.length === 0 ? (
            <div className="card py-8 text-center text-sm text-muted">Nada pendente.</div>
          ) : (
            <ul className="card divide-y divide-border p-0">
              {aReceber.map((s) => (
                <li key={s.id}>
                  <Link href={`/agenda/${s.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-background">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.tatuagem.cliente.nome}</span>
                      <span className="block truncate text-sm text-muted">
                        {formatarData(partesLocais(s.inicio).data).slice(0, 5)} · {s.tatuagem.descricao}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums text-amber-400">{reais(s.falta)}</span>
                      <span className="block text-xs text-muted tabular-nums">de {reais(Number(s.valor))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </>
  );
}

// Cor de cada forma de pagamento na barrinha do lucro.
const COR_FORMA: Record<string, string> = {
  pix: "bg-accent",
  dinheiro: "bg-emerald-400",
  debito: "bg-sky-400",
  credito: "bg-amber-400",
  outro: "bg-zinc-400",
};

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{rotulo}</span>
      <span className="tabular-nums">{valor < 0 ? `− ${reais(-valor)}` : reais(Math.abs(valor))}</span>
    </div>
  );
}
