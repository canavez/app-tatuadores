import { hoje } from "@/lib/agenda";
import { reaisParaCampo, saldo } from "@/lib/financeiro";
import { Topo } from "@/components/topo";
import { destinoSeguro } from "../../termo/dados";
import { buscarFinanceiro, urlFinanceiro } from "../../financeiro/dados";
import { PagamentoForm } from "./pagamento-form";

export default async function NovoPagamentoPage({
  params,
  searchParams,
}: PageProps<"/tatuagens/[id]/pagamentos/novo">) {
  const { id } = await params;
  const { de: deParam, sessao, tipo } = await searchParams;
  const de = destinoSeguro(deParam);
  const { tatuagem, pagamentos } = await buscarFinanceiro(id);
  const { falta } = saldo(tatuagem.valor, pagamentos);

  // Primeiro pagamento costuma ser o sinal; depois sugere o que falta.
  const tipoInicial = tipo === "sinal" || (tipo === undefined && pagamentos.length === 0) ? "sinal" : "pagamento";

  return (
    <>
      <Topo
        titulo="Registrar pagamento"
        subtitulo={`${tatuagem.cliente.nome} · ${tatuagem.descricao}`}
        voltar={de ?? urlFinanceiro(id, null)}
      />
      <PagamentoForm
        tatuagemId={id}
        de={de}
        sessaoId={typeof sessao === "string" && /^[\w-]+$/.test(sessao) ? sessao : null}
        voltar={de ?? urlFinanceiro(id, null)}
        hoje={hoje()}
        tipoInicial={tipoInicial}
        valorSugerido={tipoInicial === "pagamento" && falta ? reaisParaCampo(falta) : ""}
      />
    </>
  );
}
