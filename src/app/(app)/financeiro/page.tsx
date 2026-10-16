import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hoje, mesAno, partesLocais } from "@/lib/agenda";
import { formatarData } from "@/lib/clientes";
import { FORMAS, TIPOS, reais, saldoSessao, somar, type Pagamento } from "@/lib/financeiro";
import { Topo } from "@/components/topo";

type PagamentoDoMes = Pagamento & {
  sessao: { id: string; tatuagem: { descricao: string; cliente: { nome: string } } };
};

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
  const [doMes, abertas] = await Promise.all([
    supabase
      .from("pagamentos")
      .select(
        "id, sessao_id, valor, data, tipo, forma, observacoes, " +
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
  ]);

  const pagamentos = (doMes.data ?? []) as unknown as PagamentoDoMes[];
  const recebido = somar(pagamentos.map((p) => p.valor));
  const sinais = somar(pagamentos.filter((p) => p.tipo === "sinal").map((p) => p.valor));

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

  const erro = doMes.error || abertas.error;

  return (
    <>
      <Topo
        titulo="Financeiro"
        acoes={
          mes !== mesAtual && (
            <Link href="/financeiro" className="botao-secundario py-1.5">
              Mês atual
            </Link>
          )
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
