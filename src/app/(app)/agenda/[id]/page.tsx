import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Ellipsis,
  MessageCircle,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FORMAS, TIPOS, reais, saldoSessao, somar } from "@/lib/financeiro";
import { formatarData } from "@/lib/clientes";
import { alertas } from "@/lib/anamnese";
import { STATUS, diaDaSemanaCurto, linkLembrete, nomeDoDia, partesLocais } from "@/lib/agenda";
import { Avatar } from "@/components/avatar";
import { linkDaFoto } from "@/lib/fotos";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoIcone, Topo } from "@/components/topo";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { excluirPagamento, excluirSessao, mudarStatus } from "../actions";
import { buscarSessao } from "../dados";
import { buscarAnamnese } from "../../clientes/[id]/buscar-cliente";

/** "4 h", "1 h 30 min", "45 min" */
function duracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default async function SessaoPage({ params, searchParams }: PageProps<"/agenda/[id]">) {
  const { id } = await params;
  const { erro } = await searchParams;
  const sessao = await buscarSessao(id);
  const { cliente } = sessao.tatuagem;
  const inicio = partesLocais(sessao.inicio);
  const fim = partesLocais(sessao.fim);
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
  const minutos = Math.round((new Date(sessao.fim).getTime() - new Date(sessao.inicio).getTime()) / 60_000);
  const comAlerta = anamnese !== null && alertas(anamnese).length > 0;

  // Checklist da sessão.
  const sinal = sessao.pagamentos.find((p) => p.tipo === "sinal");
  const sinalOk = sessao.status !== "agendado";
  const realizada = sessao.status === "realizado";
  const etapas = [sinalOk, anamnese !== null, termo !== null, usados.length > 0];
  const feitas = etapas.filter(Boolean).length;

  return (
    <>
      <Topo
        titulo={`${inicio.hora} – ${fim.hora}`}
        subtitulo={nomeDoDia(inicio.data)}
        voltar={`/agenda?dia=${inicio.data}`}
        acoes={
          <>
            {cliente.telefone && ativa && (
              <a
                href={linkLembrete(cliente.telefone, cliente.nome, sessao.inicio)}
                target="_blank"
                rel="noreferrer"
                aria-label="Enviar lembrete no WhatsApp"
                title="Enviar lembrete no WhatsApp"
                className="flex size-10 items-center justify-center rounded-full text-accent hover:bg-surface"
              >
                <MessageCircle className="size-5" />
              </a>
            )}
            <BotaoIcone href={`/agenda/${sessao.id}/editar`} rotulo="Editar">
              <Pencil className="size-5" />
            </BotaoIcone>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Quem e quando */}
        <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-3">
          <Avatar nome={cliente.nome} foto={await linkDaFoto(cliente.foto)} tamanho="grande" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xl font-semibold">{cliente.nome}</span>
            <span className="block truncate text-sm text-muted">
              {sessao.tatuagem.descricao}
              {sessao.tatuagem.local_corpo && ` · ${sessao.tatuagem.local_corpo}`}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[sessao.status].cor}`}>
            {STATUS[sessao.status].rotulo}
          </span>
          <span className="flex items-center gap-1.5 text-muted tabular-nums">
            <CalendarDays className="size-4" />
            {diaDaSemanaCurto(inicio.data).replace(/^./, (c) => c.toUpperCase())},{" "}
            {formatarData(inicio.data).slice(0, 5)} · {duracao(minutos)}
          </span>
        </div>

        {erro === "conflito" && (
          <p className="aviso-erro">
            Não dá para reativar: outra sessão já ocupa esse horário. Edite a data ou o horário.
          </p>
        )}

        {comAlerta && <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />}

        {sessao.observacoes && (
          <div className="card py-3">
            <p className="text-xs text-muted">Observações</p>
            <p className="whitespace-pre-wrap text-sm">{sessao.observacoes}</p>
          </div>
        )}

        {/* Checklist */}
        <section className="flex flex-col gap-2" aria-label="Checklist da sessão">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Checklist · {feitas} de {etapas.length}
          </h2>
          <ul className="card divide-y divide-border p-0">
            <Etapa
              estado={sinalOk ? "ok" : "pendente"}
              titulo="Sinal"
              detalhe={
                sinalOk
                  ? sinal
                    ? `${reais(Number(sinal.valor))} · ${FORMAS[sinal.forma]}`
                    : "Sessão confirmada"
                  : "Ainda não registrado"
              }
              href={sinalOk ? undefined : `/agenda/${sessao.id}/pagamento`}
            />
            <Etapa
              estado={anamnese ? (comAlerta ? "alerta" : "ok") : "pendente"}
              titulo="Anamnese"
              detalhe={anamnese ? (comAlerta ? "Tem pontos de atenção" : "Sem pontos de atenção") : "Não preenchida"}
              href={`/clientes/${cliente.id}/editar#anamnese`}
            />
            <Etapa
              estado={termo ? "ok" : "pendente"}
              titulo="Termo de consentimento"
              detalhe={termo ? "Assinado" : "Pendente — toque para coletar a assinatura"}
              href={`/tatuagens/${sessao.tatuagem_id}/termo?de=/agenda/${sessao.id}`}
            />
            <li>
              <section aria-label="Materiais usados" className="flex items-center gap-3 px-4 py-3">
                <Marcador estado={usados.length > 0 ? "ok" : realizada ? "pendente" : "depois"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">Materiais usados</span>
                  <span className="block text-xs text-muted">
                    {usados.length > 0
                      ? usados.map((m) => `${m.quantidade} × ${m.item.nome}`).join(" · ")
                      : "Cartuchos, agulhas e biqueiras saem do estoque"}
                  </span>
                </span>
                <Link href={`/agenda/${sessao.id}/materiais`} className="shrink-0 text-sm font-medium underline">
                  {usados.length > 0 ? "Editar" : "Registrar"}
                </Link>
              </section>
            </li>
          </ul>
        </section>

        {/* Pagamento */}
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Pagamento</h2>
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
            <>
              {Number(sessao.valor) > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min((pago / Number(sessao.valor)) * 100, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-sm tabular-nums">
                <span className="text-green-700 dark:text-green-400">{reais(pago)} pago</span>
                {falta ? (
                  <span className="text-amber-700 dark:text-amber-400"> · falta {reais(falta)}</span>
                ) : (
                  Number(sessao.valor) > 0 && <span className="text-muted"> · quitado</span>
                )}
              </p>
            </>
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
                        Taxa da maquininha {reais(Number(p.taxa))} · sobra {reais(somar([p.valor, -p.taxa]))}
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

          <Link href={`/agenda/${sessao.id}/pagamento`} className="botao-secundario gap-2 py-2.5">
            <Plus className="size-4" />
            Registrar pagamento
          </Link>
        </section>

        {/* Ação principal fixa + menu com as outras */}
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 -mx-4 flex gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-2xl md:border">
          {sessao.status === "agendado" && (
            <Link href={`/agenda/${sessao.id}/pagamento`} className="botao flex-1 py-3">
              Registrar sinal
            </Link>
          )}
          {sessao.status === "confirmado" && (
            // Concluir passa antes pela tela de materiais usados (dá para pular).
            <Link href={`/agenda/${sessao.id}/materiais?realizar=1`} className="botao flex-1 py-3">
              Concluir sessão
            </Link>
          )}
          {sessao.status === "cancelado" && (
            <form action={mudarStatus.bind(null, sessao.id, "agendado")} className="flex flex-1">
              <button type="submit" className="botao flex-1 py-3">
                Reativar sessão
              </button>
            </form>
          )}
          {(sessao.status === "realizado" || sessao.status === "faltou") && (
            <Link href={`/agenda/nova?cliente=${cliente.id}`} className="botao-secundario flex-1 gap-2 py-3">
              <Plus className="size-4" />
              Agendar outra sessão
            </Link>
          )}

          {/* A key faz o menu fechar sozinho depois que uma ação muda o status. */}
          <details key={sessao.status} className="relative">
            <summary
              aria-label="Mais ações"
              className="botao-secundario h-full cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden"
            >
              <Ellipsis className="size-5" />
              <span className="sr-only">Mais ações</span>
            </summary>
            <div className="absolute bottom-full right-0 mb-2 flex w-64 flex-col gap-1 rounded-2xl border border-border bg-surface p-2 shadow-xl">
              {sessao.status === "agendado" && (
                <ItemMenu acao={mudarStatus.bind(null, sessao.id, "confirmado")}>Confirmar sem sinal</ItemMenu>
              )}
              {sessao.status === "confirmado" && (
                <ItemMenu acao={mudarStatus.bind(null, sessao.id, "faltou")}>Cliente faltou</ItemMenu>
              )}
              {ativa && <ItemMenu acao={mudarStatus.bind(null, sessao.id, "cancelado")}>Cancelar sessão</ItemMenu>}
              <div className="px-3 py-2">
                <BotaoExcluir
                  acao={excluirSessao.bind(null, sessao.id)}
                  rotulo="Excluir sessão"
                  confirmacao="Excluir esta sessão? Para manter o histórico, prefira cancelar."
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}

type EstadoEtapa = "ok" | "pendente" | "alerta" | "depois";

function Marcador({ estado }: { estado: EstadoEtapa }) {
  if (estado === "ok") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (estado === "alerta") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        <TriangleAlert className="size-3.5" />
      </span>
    );
  }
  return (
    <span
      className={`size-6 shrink-0 rounded-full border-2 ${estado === "pendente" ? "border-dashed border-amber-400" : "border-border"}`}
    />
  );
}

function Etapa({
  estado,
  titulo,
  detalhe,
  href,
}: {
  estado: EstadoEtapa;
  titulo: string;
  detalhe: string;
  href?: string;
}) {
  const cor = estado === "pendente" ? "text-amber-400" : estado === "alerta" ? "text-red-400" : "text-muted";
  const conteudo = (
    <>
      <Marcador estado={estado} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{titulo}</span>
        <span className={`block text-xs ${cor}`}>{detalhe}</span>
      </span>
      {href && <ChevronRight className="size-4 shrink-0 text-muted" />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 active:bg-background">
          {conteudo}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">{conteudo}</div>
      )}
    </li>
  );
}

function ItemMenu({ acao, children }: { acao: () => Promise<void>; children: ReactNode }) {
  return (
    <form action={acao}>
      <button type="submit" className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-background">
        {children}
      </button>
    </form>
  );
}
