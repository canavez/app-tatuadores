import Link from "next/link";
import { ChevronRight, CircleCheck, FileSignature, MessageCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS, linkLembrete, nomeDoDia, partesLocais, type StatusSessao } from "@/lib/agenda";
import { Avatar } from "@/components/avatar";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoIcone, Topo } from "@/components/topo";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { excluirSessao, mudarStatus } from "../actions";
import { buscarSessao } from "../dados";
import { buscarAnamnese } from "../../clientes/[id]/buscar-cliente";

// Próximos passos sugeridos para cada status.
const ACOES: Record<StatusSessao, StatusSessao[]> = {
  agendado: ["confirmado", "cancelado"],
  confirmado: ["realizado", "faltou", "cancelado"],
  realizado: [],
  faltou: [],
  cancelado: ["agendado"],
};

const ROTULO_ACAO: Record<StatusSessao, string> = {
  agendado: "Reativar sessão",
  confirmado: "Sinal pago / confirmar",
  realizado: "Marcar como realizada",
  faltou: "Cliente faltou",
  cancelado: "Cancelar sessão",
};

export default async function SessaoPage({ params, searchParams }: PageProps<"/agenda/[id]">) {
  const { id } = await params;
  const { erro } = await searchParams;
  const sessao = await buscarSessao(id);
  const { cliente } = sessao.tatuagem;
  const inicio = partesLocais(sessao.inicio);
  const supabase = await createClient();
  const [anamnese, { data: termo }] = await Promise.all([
    buscarAnamnese(cliente.id),
    supabase.from("termos").select("id").eq("tatuagem_id", sessao.tatuagem_id).maybeSingle(),
  ]);
  const ativa = sessao.status === "agendado" || sessao.status === "confirmado";

  return (
    <>
      <Topo
        titulo={`${inicio.hora} – ${partesLocais(sessao.fim).hora}`}
        subtitulo={nomeDoDia(inicio.data)}
        voltar={`/agenda?dia=${inicio.data}`}
        acoes={
          <BotaoIcone href={`/agenda/${sessao.id}/editar`} rotulo="Editar">
            <Pencil className="size-5" />
          </BotaoIcone>
        }
      />

      <div className="flex flex-col gap-4">
        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${STATUS[sessao.status].cor}`}
        >
          {STATUS[sessao.status].rotulo}
        </span>

        {erro === "conflito" && (
          <p className="aviso-erro">
            Não dá para reativar: outra sessão já ocupa esse horário. Edite a data ou o horário.
          </p>
        )}

        <div className="card divide-y divide-border p-0">
          <Link
            href={`/clientes/${cliente.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-background"
          >
            <Avatar nome={cliente.nome} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{cliente.nome}</span>
              {cliente.telefone && (
                <span className="block text-sm text-muted tabular-nums">{cliente.telefone}</span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Tatuagem</p>
            <p>
              {sessao.tatuagem.descricao}
              {sessao.tatuagem.local_corpo && (
                <span className="text-muted"> · {sessao.tatuagem.local_corpo}</span>
              )}
            </p>
          </div>
          <Link
            href={`/tatuagens/${sessao.tatuagem_id}/termo?de=/agenda/${sessao.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-background"
          >
            {termo ? (
              <CircleCheck className="size-5 text-green-600 dark:text-green-400" />
            ) : (
              <FileSignature className="size-5 text-amber-600 dark:text-amber-400" />
            )}
            <span className="flex-1">
              <span className="block text-sm">Termo de consentimento</span>
              <span
                className={`block text-xs ${termo ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}
              >
                {termo ? "Assinado" : "Pendente — toque para coletar a assinatura"}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
          {sessao.observacoes && (
            <div className="px-4 py-3">
              <p className="text-xs text-muted">Observações</p>
              <p className="whitespace-pre-wrap">{sessao.observacoes}</p>
            </div>
          )}
        </div>

        <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {ACOES[sessao.status].map((novo) => (
            <form key={novo} action={mudarStatus.bind(null, sessao.id, novo)} className="contents">
              <button
                type="submit"
                className={`${novo === "cancelado" ? "botao-secundario" : "botao"} py-3 sm:py-2`}
              >
                {ROTULO_ACAO[novo]}
              </button>
            </form>
          ))}
          {cliente.telefone && ativa && (
            <a
              href={linkLembrete(cliente.telefone, cliente.nome, sessao.inicio)}
              target="_blank"
              rel="noreferrer"
              className="botao-secundario gap-2 py-3 sm:py-2"
            >
              <MessageCircle className="size-4" />
              Enviar lembrete no WhatsApp
            </a>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <BotaoExcluir
            acao={excluirSessao.bind(null, sessao.id)}
            rotulo="Excluir sessão"
            confirmacao="Excluir esta sessão? Para manter o histórico, prefira cancelar."
          />
        </div>
      </div>
    </>
  );
}
