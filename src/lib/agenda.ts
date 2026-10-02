import { linkWhatsApp } from "./clientes";

// Horários são gravados com fuso no banco e exibidos no horário de Brasília.
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo.
export const FUSO = "America/Sao_Paulo";
const DESLOCAMENTO = "-03:00";
const DESLOCAMENTO_MS = -3 * 60 * 60 * 1000;

export const STATUS = {
  agendado: { rotulo: "Aguardando sinal", cor: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  confirmado: { rotulo: "Confirmado", cor: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
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

const formatoCurto = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

/** "2026-10-02" → "sexta-feira, 2 de outubro" */
export function nomeDoDia(data: string): string {
  return formatoDia.format(new Date(`${data}T00:00:00Z`));
}

/** "2026-10-02" → "2 de out." */
export function diaCurto(data: string): string {
  return formatoCurto.format(new Date(`${data}T00:00:00Z`));
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
