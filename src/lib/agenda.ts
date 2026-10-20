import { linkWhatsApp } from "./clientes";

// Horários são gravados com fuso no banco e exibidos no horário de Brasília.
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo.
export const FUSO = "America/Sao_Paulo";
const DESLOCAMENTO = "-03:00";
const DESLOCAMENTO_MS = -3 * 60 * 60 * 1000;

export const STATUS = {
  agendado: { rotulo: "Aguardando sinal", cor: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  confirmado: { rotulo: "Confirmado", cor: "bg-surface-alto text-lavanda" },
  realizado: { rotulo: "Realizado", cor: "bg-green-500/15 text-green-700 dark:text-green-400" },
  faltou: { rotulo: "Faltou", cor: "bg-red-500/15 text-red-700 dark:text-red-400" },
  cancelado: { rotulo: "Cancelado", cor: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 line-through" },
} as const;

export type StatusSessao = keyof typeof STATUS;

export function ehStatus(valor: unknown): valor is StatusSessao {
  return typeof valor === "string" && valor in STATUS;
}

export type Sessao = {
  id: string;
  tatuagem_id: string;
  inicio: string;
  fim: string;
  status: StatusSessao;
  observacoes: string | null;
  valor: number | null;
};

export type Tatuagem = {
  id: string;
  cliente_id: string;
  descricao: string;
  local_corpo: string | null;
};

/** "2026-10-02" + "14:30" → instante no horário de Brasília. */
export function paraInstante(data: string, hora: string): string {
  return `${data}T${hora}:00${DESLOCAMENTO}`;
}

/** Instante → { data: "2026-10-02", hora: "14:30" } no horário de Brasília. */
export function partesLocais(instante: string | Date): { data: string; hora: string } {
  const local = new Date(new Date(instante).getTime() + DESLOCAMENTO_MS).toISOString();
  return { data: local.slice(0, 10), hora: local.slice(11, 16) };
}

export function hoje(): string {
  return partesLocais(new Date()).data;
}

/** Soma dias a uma data "AAAA-MM-DD". */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana que contém a data. */
export function inicioDaSemana(data: string): string {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return somarDias(data, diaDaSemana === 0 ? -6 : 1 - diaDaSemana);
}

export function dataValida(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !isNaN(Date.parse(valor));
}

const formatoDia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const formatoMes = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const formatoDiaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short" });

/** "2026-10-02" → "outubro de 2026" */
export function mesAno(data: string): string {
  return formatoMes.format(new Date(`${data}T00:00:00Z`));
}

/** "2026-10-02" → "sex" */
export function diaDaSemanaCurto(data: string): string {
  return formatoDiaSemana.format(new Date(`${data}T00:00:00Z`)).replace(".", "");
}

/** "2026-10-02" → "sexta-feira, 2 de outubro" */
export function nomeDoDia(data: string): string {
  return formatoDia.format(new Date(`${data}T00:00:00Z`));
}

export function linkLembrete(
  telefone: string,
  nome: string,
  inicio: string,
): string {
  const { data, hora } = partesLocais(inicio);
  const primeiroNome = nome.split(" ")[0];
  const texto =
    `Olá, ${primeiroNome}! Passando para lembrar da sua sessão de tatuagem marcada para ` +
    `${nomeDoDia(data)}, às ${hora}. Qualquer dúvida é só chamar!`;
  return `${linkWhatsApp(telefone)}?text=${encodeURIComponent(texto)}`;
}

/** "14:30" ou "14:30:00" → minutos desde a meia-noite. */
export function minutosDoDia(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Minutos desde a meia-noite → "14:30". */
export function horaDeMinutos(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/** Minutos desde a meia-noite (horário de Brasília) de um instante. */
function minutosDoInstante(instante: string | Date): number {
  return minutosDoDia(partesLocais(instante).hora);
}

export type ItemLinhaDoTempo<S> =
  | { tipo: "sessao"; sessao: S; minutos: number }
  | { tipo: "livre"; inicio: string; fim: string; minutos: number };

/**
 * Monta o dia como linha do tempo: as sessões (menos as canceladas) em ordem e,
 * entre elas, os horários livres de pelo menos 30 min dentro do horário de trabalho.
 * Dias passados não mostram horário livre; hoje, só a partir de agora.
 */
export function linhaDoTempo<S extends { inicio: string; fim: string; status: StatusSessao }>(
  sessoes: S[],
  dia: string,
  horario: { inicio: string; fim: string },
): ItemLinhaDoTempo<S>[] {
  const diaHoje = hoje();
  const mostraLivre = dia >= diaHoje;
  let cursor = minutosDoDia(horario.inicio);
  if (dia === diaHoje) cursor = Math.max(cursor, Math.ceil(minutosDoInstante(new Date()) / 30) * 30);
  const fechamento = minutosDoDia(horario.fim);

  const itens: ItemLinhaDoTempo<S>[] = [];
  const livre = (de: number, ate: number) => {
    if (mostraLivre && ate - de >= 30) {
      itens.push({ tipo: "livre", inicio: horaDeMinutos(de), fim: horaDeMinutos(ate), minutos: ate - de });
    }
  };

  for (const s of sessoes.filter((s) => s.status !== "cancelado")) {
    const inicio = minutosDoInstante(s.inicio);
    // Sessão que passa da meia-noite termina, para a linha do tempo, no fim do dia.
    const fim = partesLocais(s.fim).data === dia ? minutosDoInstante(s.fim) : 24 * 60;
    livre(cursor, Math.min(inicio, fechamento));
    itens.push({ tipo: "sessao", sessao: s, minutos: fim - inicio });
    cursor = Math.max(cursor, fim);
  }
  livre(cursor, fechamento);
  return itens;
}
