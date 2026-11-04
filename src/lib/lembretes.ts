import { paraInstante, partesLocais, somarDias } from "./agenda";

/** Sessão do jeito que os lembretes precisam (agendada ou confirmada, no futuro). */
export type SessaoParaLembrete = {
  id: string;
  inicio: string;
  status: "agendado" | "confirmado";
  cliente: string;
  tatuagem: string | null;
};

export type Lembrete = {
  /** Número estável: reagendar o mesmo lembrete não cria um repetido. */
  id: number;
  titulo: string;
  corpo: string;
  quando: Date;
  /** Tela que abre ao tocar na notificação. */
  url: string;
};

/** Quantos dias à frente agendar (o iPhone guarda no máximo 64 notificações). */
export const DIAS_DE_LEMBRETE = 14;
const MAXIMO = 60;
const HORA_DA_VESPERA = "20:00";
const ANTECEDENCIA_MS = 60 * 60 * 1000;

function idDe(chave: string): number {
  let h = 0;
  for (const c of chave) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return Math.abs(h) || 1;
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/**
 * Dois tipos de lembrete:
 * - na véspera, às 20h: "Amanhã: 2 sessões" com os horários e quantas estão sem sinal;
 * - 1 hora antes de cada sessão: "Sessão às 15:00" com o cliente e a tatuagem.
 * Só entram os que ainda vão acontecer.
 */
export function montarLembretes(sessoes: SessaoParaLembrete[], agora: Date): Lembrete[] {
  const lembretes: Lembrete[] = [];
  const futuras = sessoes
    .filter((s) => new Date(s.inicio) > agora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  for (const s of futuras) {
    const quando = new Date(new Date(s.inicio).getTime() - ANTECEDENCIA_MS);
    if (quando <= agora) continue;
    const { hora } = partesLocais(s.inicio);
    const partes = [s.cliente, s.tatuagem].filter(Boolean);
    if (s.status === "agendado") partes.push("sinal não registrado");
    lembretes.push({
      id: idDe(`sessao-${s.id}`),
      titulo: `Sessão às ${hora}`,
      corpo: partes.join(" · "),
      quando,
      url: `/agenda/${s.id}`,
    });
  }

  const porDia = new Map<string, SessaoParaLembrete[]>();
  for (const s of futuras) {
    const { data } = partesLocais(s.inicio);
    porDia.set(data, [...(porDia.get(data) ?? []), s]);
  }
  for (const [data, doDia] of porDia) {
    const quando = new Date(paraInstante(somarDias(data, -1), HORA_DA_VESPERA));
    if (quando <= agora) continue;
    const horarios = doDia.map((s) => `${partesLocais(s.inicio).hora} ${s.cliente.split(" ")[0]}`);
    const semSinal = doDia.filter((s) => s.status === "agendado").length;
    lembretes.push({
      id: idDe(`vespera-${data}`),
      titulo: `Amanhã: ${plural(doDia.length, "sessão", "sessões")}`,
      corpo: horarios.join(", ") + (semSinal > 0 ? ` · ${plural(semSinal, "sem sinal", "sem sinal")}` : ""),
      quando,
      url: `/agenda?dia=${data}`,
    });
  }

  return lembretes.sort((a, b) => a.quando.getTime() - b.quando.getTime()).slice(0, MAXIMO);
}
