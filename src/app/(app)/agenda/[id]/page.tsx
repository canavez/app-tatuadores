import Link from "next/link";
import { STATUS, linkLembrete, nomeDoDia, partesLocais, type StatusSessao } from "@/lib/agenda";
import { BotaoExcluir } from "@/components/botao-excluir";
import { excluirSessao, mudarStatus } from "../actions";
import { buscarSessao } from "../dados";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
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
  const anamnese = await buscarAnamnese(cliente.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href={`/agenda?semana=${inicio.data}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← Agenda
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-muted">{nomeDoDia(inicio.data)}</p>
          <h1 className="text-2xl font-bold tabular-nums">
            {inicio.hora} – {partesLocais(sessao.fim).hora}
          </h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[sessao.status].cor}`}
          >
            {STATUS[sessao.status].rotulo}
          </span>
        </div>
        <Link href={`/agenda/${sessao.id}/editar`} className="botao-secundario">
          Editar
        </Link>
      </div>

      {erro === "conflito" && (
        <p className="aviso-erro">
          Não dá para reativar: outra sessão já ocupa esse horário. Edite a data ou o horário.
        </p>
      )}

      <dl className="card grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Cliente</dt>
          <dd className="mt-1">
            <Link href={`/clientes/${cliente.id}`} className="font-medium underline">
              {cliente.nome}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Tatuagem</dt>
          <dd className="mt-1">
            {sessao.tatuagem.descricao}
            {sessao.tatuagem.local_corpo && (
              <span className="text-muted"> · {sessao.tatuagem.local_corpo}</span>
            )}
          </dd>
        </div>
        {sessao.observacoes && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Observações</dt>
            <dd className="mt-1 whitespace-pre-wrap">{sessao.observacoes}</dd>
          </div>
        )}
      </dl>

      <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />

      <div className="flex flex-wrap gap-2">
        {ACOES[sessao.status].map((novo) => (
          <form key={novo} action={mudarStatus.bind(null, sessao.id, novo)}>
            <button type="submit" className={novo === "cancelado" ? "botao-secundario" : "botao"}>
              {ROTULO_ACAO[novo]}
            </button>
          </form>
        ))}
        {cliente.telefone && (sessao.status === "agendado" || sessao.status === "confirmado") && (
          <a
            href={linkLembrete(cliente.telefone, cliente.nome, sessao.inicio)}
            target="_blank"
            rel="noreferrer"
            className="botao-secundario"
          >
            Enviar lembrete no WhatsApp
          </a>
        )}
      </div>

      <div className="flex justify-end">
        <BotaoExcluir
          acao={excluirSessao.bind(null, sessao.id)}
          rotulo="Excluir sessão"
          confirmacao="Excluir esta sessão? Para manter o histórico, prefira cancelar."
        />
      </div>
    </div>
  );
}
