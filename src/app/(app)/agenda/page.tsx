import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  dataValida,
  diaDaSemanaCurto,
  hoje,
  inicioDaSemana,
  mesAno,
  nomeDoDia,
  paraInstante,
  partesLocais,
  somarDias,
} from "@/lib/agenda";
import { Topo } from "@/components/topo";
import { BotaoFlutuante } from "@/components/botao-flutuante";
import { CardSessao } from "@/components/card-sessao";
import { SELECT_SESSAO_COMPLETA, type SessaoCompleta } from "./dados";

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const { dia: diaParam } = await searchParams;
  const diaHoje = hoje();
  const dia = dataValida(diaParam) ? diaParam : diaHoje;
  const segunda = inicioDaSemana(dia);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));

  // Busca a semana inteira para marcar os dias que têm sessão.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessoes")
    .select(SELECT_SESSAO_COMPLETA)
    .gte("inicio", paraInstante(segunda, "00:00"))
    .lt("inicio", paraInstante(somarDias(segunda, 7), "00:00"))
    .order("inicio");
  const sessoes = (data ?? []) as unknown as SessaoCompleta[];

  const diasComSessao = new Set(
    sessoes.filter((s) => s.status !== "cancelado").map((s) => partesLocais(s.inicio).data),
  );
  const doDia = sessoes.filter((s) => partesLocais(s.inicio).data === dia);

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
        <ol className="grid flex-1 grid-cols-7 gap-1">
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
                  <span className={`text-[11px] uppercase ${selecionado ? "" : "text-muted"}`}>
                    {diaDaSemanaCurto(d)}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">{Number(d.slice(8))}</span>
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
        {doDia.length > 0 && ` · ${doDia.length} ${doDia.length === 1 ? "sessão" : "sessões"}`}
      </h2>

      {error && <p className="aviso-erro">Erro ao carregar a agenda.</p>}

      {!error && doDia.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-muted">Dia livre</p>
          <Link href={`/agenda/nova?data=${dia}`} className="botao-secundario">
            Agendar neste dia
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {doDia.map((s) => (
          <li key={s.id}>
            <CardSessao sessao={s} />
          </li>
        ))}
      </ul>

      {doDia.length > 0 && (
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
