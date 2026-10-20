import Link from "next/link";
import {
  CalendarPlus,
  ChevronRight,
  CircleCheck,
  FileSignature,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { calcularIdade, formatarData, linkWhatsApp } from "@/lib/clientes";
import { STATUS, diaDaSemanaCurto, partesLocais, type Sessao, type Tatuagem } from "@/lib/agenda";
import { createClient } from "@/lib/supabase/server";
import { reais, saldoSessao, somar } from "@/lib/financeiro";
import { TrocarFoto } from "@/components/trocar-foto";
import { linkDaFoto } from "@/lib/fotos";
import { BotaoExcluir } from "@/components/botao-excluir";
import { BotaoIcone, Topo } from "@/components/topo";
import { ResumoAnamnese } from "@/components/resumo-anamnese";
import { excluirCliente } from "../actions";
import { buscarAnamnese, buscarCliente } from "./buscar-cliente";

export default async function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const [cliente, anamnese] = await Promise.all([buscarCliente(id), buscarAnamnese(id)]);
  const idade = calcularIdade(cliente.data_nascimento);

  const supabase = await createClient();
  const { data } = await supabase
    .from("tatuagens")
    .select(
      "id, cliente_id, descricao, local_corpo, termos(id), sessoes(id, inicio, status, valor, pagamentos(valor))",
    )
    .eq("cliente_id", id)
    .order("criado_em", { ascending: false })
    .order("inicio", { referencedTable: "sessoes" });
  const tatuagens = (data ?? []) as (Tatuagem & {
    sessoes: (Pick<Sessao, "id" | "inicio" | "status" | "valor"> & {
      pagamentos: { valor: number }[];
    })[];
    termos: { id: string } | { id: string }[] | null;
  })[];

  const todasSessoes = tatuagens.flatMap((t) => t.sessoes);
  const totalSessoes = todasSessoes.filter((s) => s.status !== "cancelado").length;
  const aReceber = somar(todasSessoes.map((s) => saldoSessao(s).falta));
  const desde = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "America/Sao_Paulo" })
    .format(new Date(cliente.criado_em))
    .replace(" de ", "/")
    .replace(".", "");

  // Só mostra os dados que foram preenchidos.
  const dados = [
    { rotulo: "Telefone", valor: cliente.telefone },
    { rotulo: "Instagram", valor: cliente.instagram && `@${cliente.instagram}` },
    { rotulo: "E-mail", valor: cliente.email },
    {
      rotulo: "Nascimento",
      valor: cliente.data_nascimento && `${formatarData(cliente.data_nascimento)} · ${idade} anos`,
    },
    { rotulo: "CPF", valor: cliente.cpf },
  ].filter((d) => d.valor);

  return (
    <>
      <Topo
        titulo="Cliente"
        voltar="/clientes"
        acoes={
          <BotaoIcone href={`/clientes/${cliente.id}/editar`} rotulo="Editar">
            <Pencil className="size-5" />
          </BotaoIcone>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <TrocarFoto nome={cliente.nome} fotoUrl={await linkDaFoto(cliente.foto)} alvo={{ cliente: cliente.id }} />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{cliente.nome}</h2>
            <p className="text-sm text-muted">
              {[idade !== null && `${idade} anos`, `cliente desde ${desde}`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        {idade !== null && idade < 18 && (
          <span className="self-start rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
            Menor de idade — exige autorização do responsável
          </span>
        )}

        {/* Ações rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <AcaoRapida
            href={cliente.telefone ? linkWhatsApp(cliente.telefone) : undefined}
            rotulo="WhatsApp"
            externo
          >
            <MessageCircle className="size-5" />
          </AcaoRapida>
          <AcaoRapida
            href={cliente.instagram ? `https://instagram.com/${cliente.instagram}` : undefined}
            rotulo="Instagram"
            externo
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </AcaoRapida>
          <AcaoRapida href={`/agenda/nova?cliente=${cliente.id}`} rotulo="Agendar">
            <CalendarPlus className="size-5" />
          </AcaoRapida>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card px-2 py-3">
            <p className="text-lg font-semibold tabular-nums">{tatuagens.length}</p>
            <p className="text-xs text-muted">{tatuagens.length === 1 ? "tatuagem" : "tatuagens"}</p>
          </div>
          <div className="card px-2 py-3">
            <p className="text-lg font-semibold tabular-nums">{totalSessoes}</p>
            <p className="text-xs text-muted">{totalSessoes === 1 ? "sessão" : "sessões"}</p>
          </div>
          <div className="card px-2 py-3">
            <p className={`text-lg font-semibold tabular-nums ${aReceber > 0 ? "text-amber-400" : ""}`}>
              {reais(aReceber).replace(",00", "")}
            </p>
            <p className="text-xs text-muted">a receber</p>
          </div>
        </div>

        <ResumoAnamnese clienteId={cliente.id} anamnese={anamnese} />

        {(dados.length > 0 || cliente.observacoes) && (
          <dl className="card divide-y divide-border p-0">
            {dados.map((d) => (
              <div key={d.rotulo} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{d.rotulo}</dt>
                <dd className="truncate text-right">{d.valor}</dd>
              </div>
            ))}
            {cliente.observacoes && (
              <div className="px-4 py-3 text-sm">
                <dt className="text-muted">Observações</dt>
                <dd className="mt-1 whitespace-pre-wrap">{cliente.observacoes}</dd>
              </div>
            )}
          </dl>
        )}

        <h2 className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">Tatuagens</h2>

        {tatuagens.length === 0 ? (
          <div className="card py-8 text-center text-sm text-muted">Nenhuma tatuagem ainda.</div>
        ) : (
          tatuagens.map((t) => (
            <section key={t.id} className="card p-0">
              <header className="flex flex-col gap-0.5 px-4 pb-1 pt-3">
                <div className="flex items-start gap-3">
                  <h3 className="min-w-0 flex-1 font-medium">{t.descricao}</h3>
                  <SeloTermo tatuagemId={t.id} assinado={temTermo(t.termos)} />
                </div>
                <ResumoTatuagem localCorpo={t.local_corpo} sessoes={t.sessoes} />
              </header>
              <ul className="divide-y divide-border">
                {t.sessoes.map((s) => {
                  const inicio = partesLocais(s.inicio);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/agenda/${s.id}`}
                        className="flex items-center gap-3 px-4 py-3 text-sm active:bg-background"
                      >
                        <span className="tabular-nums">
                          {diaDaSemanaCurto(inicio.data).replace(/^./, (c) => c.toUpperCase())},{" "}
                          {formatarData(inicio.data).slice(0, 5)}
                          {inicio.data.slice(0, 4) !== String(new Date().getFullYear()) && `/${inicio.data.slice(2, 4)}`} ·{" "}
                          {inicio.hora}
                        </span>
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[s.status].cor}`}
                        >
                          {STATUS[s.status].rotulo}
                        </span>
                        <ChevronRight className="size-4 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <div className="mt-4 flex justify-center">
          <BotaoExcluir
            acao={excluirCliente.bind(null, cliente.id)}
            rotulo="Excluir cliente"
            confirmacao="Excluir este cliente? As tatuagens e sessões dele também serão apagadas. Essa ação não pode ser desfeita."
          />
        </div>
      </div>
    </>
  );
}

/** Local do corpo e total da tatuagem (soma das sessões que contam: não canceladas nem com falta). */
function ResumoTatuagem({
  localCorpo,
  sessoes,
}: {
  localCorpo: string | null;
  sessoes: { valor: number | null; status: string; pagamentos: { valor: number }[] }[];
}) {
  const comValor = sessoes.filter((s) => s.valor !== null);
  const falta = somar(sessoes.map((s) => saldoSessao(s).falta));
  const total = somar(
    comValor.filter((s) => s.status !== "cancelado" && s.status !== "faltou").map((s) => s.valor),
  );
  return (
    <p className="text-sm text-muted tabular-nums">
      {[localCorpo, comValor.length > 0 && `Total ${reais(total)}`].filter(Boolean).join(" · ")}
      {comValor.length > 0 &&
        (falta > 0 ? (
          <span className="text-amber-400"> · falta {reais(falta)}</span>
        ) : (
          <span className="text-green-400"> · quitado</span>
        ))}
    </p>
  );
}

function AcaoRapida({
  href,
  rotulo,
  externo,
  children,
}: {
  href?: string;
  rotulo: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  const classes =
    "card flex flex-col items-center gap-1 p-3 text-xs font-medium transition active:scale-95";
  if (!href) {
    return (
      <span className={`${classes} text-muted opacity-50`} aria-disabled>
        {children}
        {rotulo}
      </span>
    );
  }
  return externo ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${classes} text-accent`}>
      {children}
      {rotulo}
    </a>
  ) : (
    <Link href={href} className={`${classes} text-accent`}>
      {children}
      {rotulo}
    </Link>
  );
}

// O Supabase devolve o termo como objeto (um por tatuagem) ou lista, conforme a relação.
function temTermo(termos: { id: string } | { id: string }[] | null): boolean {
  return Array.isArray(termos) ? termos.length > 0 : termos !== null;
}

function SeloTermo({ tatuagemId, assinado }: { tatuagemId: string; assinado: boolean }) {
  return (
    <Link
      href={`/tatuagens/${tatuagemId}/termo`}
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
        assinado
          ? "bg-green-500/15 text-green-700 dark:text-green-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      }`}
    >
      {assinado ? <CircleCheck className="size-3.5" /> : <FileSignature className="size-3.5" />}
      {assinado ? "Termo assinado" : "Termo pendente"}
    </Link>
  );
}
