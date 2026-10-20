/** Períodos do relatório financeiro e seus nomes. */

export const TIPOS_PERIODO = {
  mes: { rotulo: "Mês", meses: 1 },
  trimestre: { rotulo: "Trimestre", meses: 3 },
  semestre: { rotulo: "Semestre", meses: 6 },
  ano: { rotulo: "Ano", meses: 12 },
} as const;

export type TipoPeriodo = keyof typeof TIPOS_PERIODO;

export type Periodo = {
  tipo: TipoPeriodo;
  /** Primeiro mês do período, "2026-07". */
  inicio: string;
  /** Meses do período, em ordem: ["2026-07", "2026-08", "2026-09"]. */
  meses: string[];
  /** Primeiro dia depois do período, "2026-10-01". */
  fimExclusivo: string;
  nome: string;
};

const NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-10" + n meses */
export function somarMeses(mes: string, n: number): string {
  const d = new Date(`${mes}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** "2026-10" → "out" */
export function mesCurto(mes: string): string {
  return MES_CURTO[Number(mes.slice(5, 7)) - 1];
}

export function ehTipoPeriodo(valor: unknown): valor is TipoPeriodo {
  return typeof valor === "string" && valor in TIPOS_PERIODO;
}

/** Monta o período do tipo pedido que contém o mês de referência. */
export function montarPeriodo(tipo: TipoPeriodo, referencia: string): Periodo {
  const ano = referencia.slice(0, 4);
  const mes = Number(referencia.slice(5, 7));
  const tamanho = TIPOS_PERIODO[tipo].meses;
  const primeiroMes = tipo === "mes" ? mes : Math.floor((mes - 1) / tamanho) * tamanho + 1;
  const inicio = `${ano}-${String(primeiroMes).padStart(2, "0")}`;
  const meses = Array.from({ length: tamanho }, (_, i) => somarMeses(inicio, i));
  const fimExclusivo = `${somarMeses(inicio, tamanho)}-01`;

  const nome =
    tipo === "mes"
      ? `${NOME_MES[primeiroMes - 1].replace(/^./, (c) => c.toUpperCase())} de ${ano}`
      : tipo === "trimestre"
        ? `${(primeiroMes - 1) / 3 + 1}º trimestre de ${ano} (${mesCurto(meses[0])}–${mesCurto(meses[2])})`
        : tipo === "semestre"
          ? `${primeiroMes === 1 ? 1 : 2}º semestre de ${ano}`
          : `Ano de ${ano}`;

  return { tipo, inicio, meses, fimExclusivo, nome };
}
