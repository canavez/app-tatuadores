import Link from "next/link";
import { ChevronRight, CircleCheck, FileSignature, MessageCircle, Package, Pencil, Plus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FORMAS, TIPOS, reais, saldoSessao, somar } from "@/lib/financeiro";
import { formatarData } from "@/lib/clientes";
import { STATUS, linkLembrete, nomeDoDia, partesLocais, type StatusSessao } from "@/lib/agenda";
import { Avatar } from "@/components/avatar";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoIcone, Topo } from "@/components/topo";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { excluirPagamento, excluirSessao, mudarStatus } from "../actions";
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
  const [anamnese, { data: termo }, { data: materiais }] = await Promise.all([
    buscarAnamnese(cliente.id),
    supabase.from("termos").select("id").eq("tatuagem_id", sessao.tatuagem_id).maybeSingle(),
    supabase
      .from("sessao_materiais")
      .select("quantidade, item:itens_estoque!inner(nome)")
      .eq("sessao_id", sessao.id),
  ]);
  const usados = (materiais ?? []) as unknown as { quantidade: number; item: { nome: string } }[];
  const ativa = sessao.status === "agendado" || sessao.status === "confirmado";
  const { pago, falta } = saldoSessao(sessao);

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

        <section className="card flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-muted" />
            <h2 className="flex-1 font-medium">Pagamento</h2>
            {sessao.valor !== null && (
              <span className="font-semibold tabular-nums">{reais(Number(sessao.valor))}</span>
            )}
          </div>

          {sessao.valor === null ? (
            <p className="text-sm text-muted">
              Valor da sessão não definido.{" "}
              <Link href={`/agenda/${sessao.id}/editar`} className="font-medium text-foreground underline">
                Informar valor
              </Link>
            </p>
          ) : (
            <p className="text-sm tabular-nums">
              <span className="text-green-700 dark:text-green-400">{reais(pago)} pago</span>
              {falta ? (
                <span className="text-amber-700 dark:text-amber-400"> · falta {reais(falta)}</span>
              ) : (
                Number(sessao.valor) > 0 && <span className="text-muted"> · quitado</span>
              )}
            </p>
          )}

          {sessao.pagamentos.length > 0 && (
            <ul className="divide-y divide-border border-t border-border">
              {sessao.pagamentos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium tabular-nums">{reais(Number(p.valor))}</span>
                    <span className="text-muted">
                      {" "}
                      · {TIPOS[p.tipo]} · {FORMAS[p.forma]} · {formatarData(p.data)}
                    </span>
                    {Number(p.taxa) > 0 && (
                      <span className="block text-xs text-muted tabular-nums">
                        Taxa da maquininha {reais(Number(p.taxa))} · sobra{" "}
                        {reais(somar([p.valor, -p.taxa]))}
                      </span>
                    )}
                    {p.observacoes && <span className="block text-muted">{p.observacoes}</span>}
                  </span>
                  <BotaoExcluir
                    acao={excluirPagamento.bind(null, p.id, sessao.id)}
                    rotulo="Excluir"
                    confirmacao={`Excluir o pagamento de ${reais(Number(p.valor))}?`}
                  />
                </li>
              ))}
            </ul>
          )}

          <Link href={`/agenda/${sessao.id}/pagamento`} className="botao-secundario gap-2 py-3 sm:py-2">
            <Plus className="size-4" />
            {sessao.status === "agendado" ? "Registrar sinal" : "Registrar pagamento"}
          </Link>
        </section>

        <section className="card flex flex-col gap-3" aria-label="Materiais usados">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-muted" />
            <h2 className="flex-1 font-medium">Materiais usados</h2>
            <Link href={`/agenda/${sessao.id}/materiais`} className="text-sm font-medium underline">
              {usados.length > 0 ? "Editar" : "Registrar"}
            </Link>
          </div>
          <p className="text-sm text-muted">
            {usados.length > 0
              ? usados.map((m) => `${m.quantidade} × ${m.item.nome}`).join(" · ")
              : "Cartuchos, agulhas e biqueiras usados nesta sessão saem do estoque."}
          </p>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {ACOES[sessao.status].map((novo) =>
            // Concluir passa antes pela tela de materiais usados (dá para pular).
            novo === "realizado" ? (
              <Link key={novo} href={`/agenda/${sessao.id}/materiais?realizar=1`} className="botao py-3 sm:py-2">
                {ROTULO_ACAO[novo]}
              </Link>
            ) : (
            <form key={novo} action={mudarStatus.bind(null, sessao.id, novo)} className="contents">
              <button
                type="submit"
                className={`${novo === "cancelado" ? "botao-secundario" : "botao"} py-3 sm:py-2`}
              >
                {ROTULO_ACAO[novo]}
              </button>
            </form>
            ),
          )}
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
