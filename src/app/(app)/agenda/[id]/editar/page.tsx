import { Topo } from "@/components/topo";
import { partesLocais } from "@/lib/agenda";
import { SessaoForm } from "../../sessao-form";
import { buscarSessao, opcoesDoFormulario } from "../../dados";

export default async function EditarSessaoPage({ params }: PageProps<"/agenda/[id]/editar">) {
  const { id } = await params;
  const [sessao, { clientes, tatuagens }] = await Promise.all([
    buscarSessao(id),
    opcoesDoFormulario(),
  ]);
  const inicio = partesLocais(sessao.inicio);

  return (
    <>
      <Topo titulo="Editar sessão" voltar={`/agenda/${id}`} />
      <SessaoForm
        clientes={clientes}
        tatuagens={tatuagens}
        sessao={{
          id: sessao.id,
          cliente_id: sessao.tatuagem.cliente_id,
          tatuagem_id: sessao.tatuagem_id,
          data: inicio.data,
          hora_inicio: inicio.hora,
          hora_fim: partesLocais(sessao.fim).hora,
          status: sessao.status,
          observacoes: sessao.observacoes,
          valor: sessao.valor,
        }}
      />
    </>
  );
}
