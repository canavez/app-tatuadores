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
  const { mes: mesParam } = await searchParams;
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
      rotulo,
      total: somar(pagamentos.filter((p) => p.forma === forma).map((p) => p.valor)),
    }))
    .filter((f) => f.total > 0);

  const erro = doMes.error || abertas.error || despesasDoMes.error;

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

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-muted">Recebido no mês</p>
            <p className="text-xl font-semibold tabular-nums text-green-700 dark:text-green-400">
              {reais(recebido)}
            </p>
            {sinais > 0 && <p className="mt-1 text-xs text-muted tabular-nums">{reais(sinais)} em sinais</p>}
          </div>
          <div className="card">
            <p className="text-xs text-muted">A receber</p>
            <p className="text-xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {reais(totalAReceber)}
            </p>
            <p className="mt-1 text-xs text-muted">de todas as sessões</p>
          </div>
        </div>

        {porForma.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {porForma.map((f) => (
              <span key={f.rotulo} className="rounded-full bg-surface px-3 py-1 text-xs tabular-nums">
                {f.rotulo}: <span className="font-semibold">{reais(f.total)}</span>
              </span>
            ))}
          </div>
        )}

        <section className="card flex flex-col gap-2 text-sm" aria-label="Resultado do mês">
          <h2 className="mb-1 font-semibold">Resultado do mês</h2>
          <Linha rotulo="Recebido" valor={recebido} />
          <Linha rotulo="Taxas da maquininha" valor={-taxas} />
          <Linha
            rotulo={
              proprio
                ? "Contas fixas"
                : `Comissão do estúdio${custoEstudio > 0 ? ` (${percentualComissao}%)` : ""}`
            }
            valor={-custoEstudio}
          />
          <Linha rotulo="Despesas" valor={-totalDespesas} />
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Lucro</span>
            <span
              className={`tabular-nums ${lucro < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
            >
              {reais(lucro)}
            </span>
          </div>
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

        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Recebimentos do mês
        </h2>
        {pagamentos.length === 0 ? (
          <div className="card py-8 text-center text-sm text-muted">Nenhum pagamento neste mês.</div>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {pagamentos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/agenda/${p.sessao.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-background"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.sessao.tatuagem.cliente.nome}</span>
                    <span className="block truncate text-sm text-muted">
                      {formatarData(p.data)} · {TIPOS[p.tipo]} · {FORMAS[p.forma]}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{reais(Number(p.valor))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Despesas do mês</h2>
          <Link href={`/financeiro/despesas/nova?mes=${mes}`} className="botao-secundario gap-1 py-1.5">
            <Plus className="size-4" />
            Despesa
          </Link>
        </div>
        {despesas.length === 0 ? (
          <div className="card py-8 text-center text-sm text-muted">Nenhuma despesa neste mês.</div>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {despesas.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{d.descricao}</span>
                  <span className="block text-sm text-muted">
                    {formatarData(d.data)} · {CATEGORIAS[d.categoria]}
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

        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">A receber</h2>
        {aReceber.length === 0 ? (
          <div className="card py-8 text-center text-sm text-muted">Nada pendente.</div>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {aReceber.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/agenda/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-background"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.tatuagem.cliente.nome}</span>
                    <span className="block truncate text-sm text-muted">
                      {formatarData(partesLocais(s.inicio).data)} · {s.tatuagem.descricao}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {reais(s.falta)}
                    </span>
                    <span className="block text-xs text-muted tabular-nums">de {reais(Number(s.valor))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{rotulo}</span>
      <span className="tabular-nums">{valor < 0 ? `− ${reais(-valor)}` : reais(Math.abs(valor))}</span>
    </div>
  );
}
