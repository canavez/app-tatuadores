import { hoje, nomeDoDia, partesLocais } from "@/lib/agenda";
import { reaisParaCampo, saldoSessao } from "@/lib/financeiro";
import { Topo } from "@/components/topo";
import { buscarSessao } from "../../dados";
import { PagamentoForm } from "./pagamento-form";

export default async function NovoPagamentoPage({ params }: PageProps<"/agenda/[id]/pagamento">) {
  const { id } = await params;
  const sessao = await buscarSessao(id);
  const { falta } = saldoSessao(sessao);

  // Sessão aguardando sinal sugere "Sinal"; depois sugere o valor que falta.
  const tipoInicial = sessao.status === "agendado" ? "sinal" : "pagamento";

  return (
    <>
      <Topo
        titulo={tipoInicial === "sinal" ? "Registrar sinal" : "Registrar pagamento"}
        subtitulo={`${sessao.tatuagem.cliente.nome} · ${nomeDoDia(partesLocais(sessao.inicio).data)}`}
        voltar={`/agenda/${id}`}
      />
      <PagamentoForm
        sessaoId={id}
        hoje={hoje()}
        tipoInicial={tipoInicial}
        valorSugerido={tipoInicial === "pagamento" && falta ? reaisParaCampo(falta) : ""}
      />
    </>
  );
}
