import Link from "next/link";
import { Plus } from "lucide-react";
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
import {
  FaixaDias,
  MesDaFaixa,
  ProvedorDoMes,
  type DiaDaFaixa,
} from "./faixa-dias";
import { buscarConfiguracoes } from "@/lib/configuracoes";
import { SELECT_SESSAO_COMPLETA, type SessaoCompleta } from "./dados";

// Semanas antes e depois da semana escolhida que a faixa de dias deixa rolar.
const SEMANAS = 8;

export default async function AgendaPage({
  searchParams,
}: PageProps<"/agenda">) {
  const { dia: diaParam } = await searchParams;
  const diaHoje = hoje();
  const dia = dataValida(diaParam) ? diaParam : diaHoje;
  const segunda = inicioDaSemana(dia);
  const primeiro = somarDias(segunda, -SEMANAS * 7);
  const dias = Array.from({ length: (SEMANAS * 2 + 1) * 7 }, (_, i) =>
    somarDias(primeiro, i),
  );

  // Sessões do dia escolhido, e só o horário das sessões da faixa toda (para as bolinhas).
  const supabase = await createClient();
  const [{ data, error }, { data: daFaixa }, config] = await Promise.all([
    supabase
      .from("sessoes")
      .select(SELECT_SESSAO_COMPLETA)
      .gte("inicio", paraInstante(dia, "00:00"))
      .lt("inicio", paraInstante(somarDias(dia, 1), "00:00"))
      .order("inicio"),
    supabase
      .from("sessoes")
      .select("inicio")
      .neq("status", "cancelado")
      .gte("inicio", paraInstante(primeiro, "00:00"))
      .lt("inicio", paraInstante(somarDias(primeiro, dias.length), "00:00")),
    buscarConfiguracoes(),
  ]);
  const doDia = (data ?? []) as unknown as SessaoCompleta[];

  const diasComSessao = new Set(
    (daFaixa ?? []).map((s) => partesLocais(s.inicio).data),
  );
  const faixa: DiaDaFaixa[] = dias.map((d) => ({
    data: d,
    curto: diaDaSemanaCurto(d),
    numero: Number(d.slice(8)),
    rotulo: nomeDoDia(d),
    mes: mesAno(d).replace(/^./, (c) => c.toUpperCase()),
    temSessao: diasComSessao.has(d),
  }));
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
    <ProvedorDoMes inicial={faixa[SEMANAS * 7 + 3].mes}>
      <Topo
        titulo={<MesDaFaixa />}
        acoes={
          dia !== diaHoje && (
            <Link href="/agenda" className="botao-secundario py-1.5">
              Hoje
            </Link>
          )
        }
      />

      {/* Faixa de dias (carrossel) */}
      <FaixaDias dias={faixa} inicio={SEMANAS * 7} dia={dia} hoje={diaHoje} />

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
    </ProvedorDoMes>
  );
}
