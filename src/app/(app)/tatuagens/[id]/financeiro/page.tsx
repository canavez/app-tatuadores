import Link from "next/link";
import { Plus } from "lucide-react";
import { formatarData } from "@/lib/clientes";
import { FORMAS, TIPOS, reais, saldo } from "@/lib/financeiro";
import { Topo } from "@/components/topo";
import { BotaoExcluir } from "@/components/botao-excluir";
import { destinoSeguro } from "../termo/dados";
import { excluirPagamento } from "./actions";
import { buscarFinanceiro } from "./dados";
import { ValorForm } from "./valor-form";

export default async function FinanceiroTatuagemPage({
  params,
  searchParams,
}: PageProps<"/tatuagens/[id]/financeiro">) {
  const { id } = await params;
  const de = destinoSeguro((await searchParams).de);
  const { tatuagem, pagamentos } = await buscarFinanceiro(id);
  const { pago, falta } = saldo(tatuagem.valor, pagamentos);
  const novoPagamento = `/tatuagens/${id}/pagamentos/novo${de ? `?de=${encodeURIComponent(de)}` : ""}`;

  return (
    <>
      <Topo
        titulo="Financeiro"
        subtitulo={`${tatuagem.cliente.nome} · ${tatuagem.descricao}`}
        voltar={de ?? `/clientes/${tatuagem.cliente.id}`}
      />

      <div className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4">
          <ValorForm tatuagemId={id} valor={tatuagem.valor} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted">Pago</p>
              <p className="text-lg font-semibold tabular-nums text-green-700 dark:text-green-400">
                {reais(pago)}
              </p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted">Falta</p>
              <p
                className={`text-lg font-semibold tabular-nums ${falta ? "text-amber-700 dark:text-amber-400" : ""}`}
              >
                {falta === null ? "—" : reais(falta)}
              </p>
            </div>
          </div>
          {falta === null && (
            <p className="text-xs text-muted">
              Informe o valor combinado para o app calcular quanto falta receber.
            </p>
          )}
        </div>

        <Link href={novoPagamento} className="botao gap-2 py-3">
          <Plus className="size-4" />
          Registrar pagamento
        </Link>

        <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">Pagamentos</h2>

        {pagamentos.length === 0 ? (
          <div className="card py-8 text-center text-sm text-muted">Nenhum pagamento ainda.</div>
        ) : (
          <ul className="card divide-y divide-border p-0">
            {pagamentos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium tabular-nums">{reais(Number(p.valor))}</p>
                  <p className="text-sm text-muted">
                    {TIPOS[p.tipo]} · {FORMAS[p.forma]} · {formatarData(p.data)}
                  </p>
                  {p.observacoes && <p className="text-sm text-muted">{p.observacoes}</p>}
                </div>
                <BotaoExcluir
                  acao={excluirPagamento.bind(null, p.id, id, de)}
                  rotulo="Excluir"
                  confirmacao={`Excluir o pagamento de ${reais(Number(p.valor))}?`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
