import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS,
  dataValida,
  diaCurto,
  hoje,
  inicioDaSemana,
  nomeDoDia,
  paraInstante,
  partesLocais,
  somarDias,
} from "@/lib/agenda";
import { SELECT_SESSAO_COMPLETA, type SessaoCompleta } from "./dados";

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const { semana } = await searchParams;
  const diaHoje = hoje();
  const segunda = inicioDaSemana(dataValida(semana) ? semana : diaHoje);
  const proximaSegunda = somarDias(segunda, 7);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessoes")
    .select(SELECT_SESSAO_COMPLETA)
    .gte("inicio", paraInstante(segunda, "00:00"))
    .lt("inicio", paraInstante(proximaSegunda, "00:00"))
    .order("inicio");
  const sessoes = (data ?? []) as unknown as SessaoCompleta[];

  const porDia = new Map<string, SessaoCompleta[]>();
  for (const s of sessoes) {
    const dia = partesLocais(s.inicio).data;
    porDia.set(dia, [...(porDia.get(dia) ?? []), s]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Link href="/agenda/nova" className="botao">
          + Nova sessão
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link href={`/agenda?semana=${somarDias(segunda, -7)}`} className="botao-secundario">
          ←<span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
        </Link>
        <div className="text-center">
          <p className="font-semibold">
            {diaCurto(segunda)} – {diaCurto(somarDias(segunda, 6))}
          </p>
          {segunda !== inicioDaSemana(diaHoje) && (
            <Link href="/agenda" className="text-sm text-muted underline">
              Voltar para hoje
            </Link>
          )}
        </div>
        <Link href={`/agenda?semana=${proximaSegunda}`} className="botao-secundario">
          <span className="sr-only sm:not-sr-only sm:mr-1">Próxima</span>→
        </Link>
      </div>

      {error && <p className="aviso-erro">Erro ao carregar a agenda.</p>}

      <div className="flex flex-col gap-3">
        {dias.map((dia) => {
          const doDia = porDia.get(dia) ?? [];
          const ehHoje = dia === diaHoje;
          return (
            <section
              key={dia}
              className={`card p-0 ${ehHoje ? "border-accent" : ""} ${dia < diaHoje ? "opacity-70" : ""}`}
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-2">
                <h2 className="text-sm font-semibold capitalize">
                  {nomeDoDia(dia)}
                  {ehHoje && <span className="ml-2 text-xs font-bold text-accent">HOJE</span>}
                </h2>
                <Link
                  href={`/agenda/nova?data=${dia}`}
                  className="text-sm text-muted hover:text-foreground"
                  aria-label={`Agendar em ${nomeDoDia(dia)}`}
                >
                  + agendar
                </Link>
              </header>
              {doDia.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">Livre</p>
              ) : (
                <ul className="divide-y divide-border">
                  {doDia.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/agenda/${s.id}`}
                        className="flex flex-col gap-1 px-4 py-3 hover:bg-background sm:flex-row sm:items-center sm:gap-4"
                      >
                        <span className="font-mono text-sm tabular-nums">
                          {partesLocais(s.inicio).hora}–{partesLocais(s.fim).hora}
                        </span>
                        <span className="flex-1">
                          <span className="font-medium">{s.tatuagem.cliente.nome}</span>
                          <span className="text-sm text-muted"> · {s.tatuagem.descricao}</span>
                        </span>
                        <span
                          className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold sm:self-auto ${STATUS[s.status].cor}`}
                        >
                          {STATUS[s.status].rotulo}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
