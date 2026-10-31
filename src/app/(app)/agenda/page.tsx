import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  dataValida,
  diaDaSemanaCurto,
  hoje,
  inicioDaSemana,
  linhaDoTempo,
  mesAno,
  nomeDoDia,
  paraInstante,
  partesLocais,
  somarDias,
} from "@/lib/agenda";
import { Topo } from "@/components/topo";
import { BotaoFlutuante } from "@/components/botao-flutuante";
import { CardSessao } from "@/components/card-sessao";
import { ArrastarSemana } from "./arrastar-semana";
import { buscarConfiguracoes } from "@/lib/configuracoes";
import { SELECT_SESSAO_COMPLETA, type SessaoCompleta } from "./dados";

export default async function AgendaPage({
  searchParams,
}: PageProps<"/agenda">) {
  const { dia: diaParam } = await searchParams;
  const diaHoje = hoje();
  const dia = dataValida(diaParam) ? diaParam : diaHoje;
  const segunda = inicioDaSemana(dia);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));

  // Busca a semana inteira para marcar os dias que têm sessão.
  const supabase = await createClient();
  const [{ data, error }, config] = await Promise.all([
    supabase
      .from("sessoes")
      .select(SELECT_SESSAO_COMPLETA)
      .gte("inicio", paraInstante(segunda, "00:00"))
      .lt("inicio", paraInstante(somarDias(segunda, 7), "00:00"))
      .order("inicio"),
    buscarConfiguracoes(),
  ]);
  const sessoes = (data ?? []) as unknown as SessaoCompleta[];

  const diasComSessao = new Set(
    sessoes
      .filter((s) => s.status !== "cancelado")
      .map((s) => partesLocais(s.inicio).data),
  );
  const doDia = sessoes.filter((s) => partesLocais(s.inicio).data === dia);
  const linha = linhaDoTempo(doDia, dia, {
    inicio: config.hora_inicio,
    fim: config.hora_fim,
  });
  const canceladas = doDia.filter((s) => s.status === "cancelado");
  const ativas = doDia.length - canceladas.length;
  const minutosLivres = linha.reduce(
    (t, i) => (i.tipo === "livre" ? t + i.minutos : t),
    0,
  );
  const horasLivres =
    minutosLivres >= 60
      ? `${Math.floor(minutosLivres / 60)} h${minutosLivres % 60 ? ` ${minutosLivres % 60} min` : ""}`
      : `${minutosLivres} min`;

  return (
    <>
      <Topo
        titulo={mesAno(dia).replace(/^./, (c) => c.toUpperCase())}
        acoes={
          dia !== diaHoje && (
            <Link href="/agenda" className="botao-secundario py-1.5">
              Hoje
            </Link>
          )
        }
      />

      {/* Faixa da semana */}
      <div className="flex items-center gap-1">
        <Link
          href={`/agenda?dia=${somarDias(dia, -7)}`}
          aria-label="Semana anterior"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <ArrastarSemana
          anterior={`/agenda?dia=${somarDias(dia, -7)}`}
          proxima={`/agenda?dia=${somarDias(dia, 7)}`}
        >
          <ol className="grid grid-cols-7 gap-1">
            {dias.map((d) => {
              const selecionado = d === dia;
              const ehHoje = d === diaHoje;
              return (
                <li key={d}>
                  <Link
                    href={`/agenda?dia=${d}`}
                    aria-label={nomeDoDia(d)}
                    aria-current={selecionado ? "date" : undefined}
                    className={`flex flex-col items-center rounded-2xl py-2 transition ${
                      selecionado
                        ? "bg-accent text-accent-foreground"
                        : ehHoje
                          ? "text-accent"
                          : "hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`text-[11px] uppercase ${selecionado ? "" : "text-muted"}`}
                    >
                      {diaDaSemanaCurto(d)}
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {Number(d.slice(8))}
                    </span>
                    <span
                      className={`mt-0.5 size-1.5 rounded-full ${
                        diasComSessao.has(d)
                          ? selecionado
                            ? "bg-accent-foreground"
                            : "bg-accent"
                          : "bg-transparent"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </ArrastarSemana>
        <Link
          href={`/agenda?dia=${somarDias(dia, 7)}`}
          aria-label="Próxima semana"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface"
        >
          <ChevronRight className="size-5" />
        </Link>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted first-letter:uppercase">
        {nomeDoDia(dia)}
        {ativas > 0 && ` · ${ativas} ${ativas === 1 ? "sessão" : "sessões"}`}
        {minutosLivres > 0 && ` · ${horasLivres} livres`}
      </h2>

      {error && <p className="aviso-erro">Erro ao carregar a agenda.</p>}

      {!error && linha.length === 0 && (
        <div className="card py-10 text-center text-muted">
          {dia < diaHoje
            ? "Nenhuma sessão neste dia."
            : "Sem horário livre neste dia."}
        </div>
      )}

      {/* Linha do tempo: sessões com altura pela duração e os horários livres entre elas. */}
      <ul className="flex flex-col gap-2">
        {linha.map((item) =>
          item.tipo === "sessao" ? (
            <li key={item.sessao.id}>
              <CardSessao sessao={item.sessao} minutos={item.minutos} />
            </li>
          ) : (
            <li key={`livre-${item.inicio}`}>
              <Link
                href={`/agenda/nova?data=${dia}&inicio=${item.inicio}&fim=${item.fim}`}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted transition hover:border-accent/50 hover:text-foreground active:scale-[0.99]"
              >
                <Plus className="size-4 shrink-0" />
                <span>
                  Livre ·{" "}
                  <span className="tabular-nums">
                    {item.inicio} – {item.fim}
                  </span>
                </span>
              </Link>
            </li>
          ),
        )}
      </ul>

      {canceladas.length > 0 && (
        <section className="mt-5 flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
            Canceladas
          </h3>
          <ul className="flex flex-col gap-2">
            {canceladas.map((s) => (
              <li key={s.id}>
                <CardSessao sessao={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {dia >= diaHoje && (
        <Link
          href={`/agenda/nova?data=${dia}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground active:scale-[0.99]"
        >
          <Plus className="size-4" />
          Agendar neste dia
        </Link>
      )}

      <BotaoFlutuante href={`/agenda/nova?data=${dia}`} rotulo="Nova sessão" />
    </>
  );
}
