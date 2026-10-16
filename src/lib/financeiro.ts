export const FORMAS = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  outro: "Outro",
} as const;

export const TIPOS = {
  sinal: "Sinal",
  pagamento: "Pagamento",
} as const;

export type Forma = keyof typeof FORMAS;
export type TipoPagamento = keyof typeof TIPOS;

export type Pagamento = {
  id: string;
  tatuagem_id: string;
  valor: number;
  data: string;
  tipo: TipoPagamento;
  forma: Forma;
  observacoes: string | null;
};

export function ehForma(valor: unknown): valor is Forma {
  return typeof valor === "string" && valor in FORMAS;
}

export function ehTipo(valor: unknown): valor is TipoPagamento {
  return typeof valor === "string" && valor in TIPOS;
}

const formatoReais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1500 → "R$ 1.500,00" */
export function reais(valor: number): string {
  return formatoReais.format(valor);
}

/**
 * Lê o valor digitado em reais: "1500", "1.500", "1.500,50", "150,5" ou "150.50".
 * Devolve null se não for um número válido.
 */
export function lerReais(texto: string | null): number | null {
  if (!texto) return null;
  let limpo = texto.replace(/[R$\s]/g, "");
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Number(limpo);
}

/** Valor em reais para preencher um campo de texto: 1500.5 → "1500,50". */
export function reaisParaCampo(valor: number | null): string {
  return valor === null ? "" : valor.toFixed(2).replace(".", ",");
}

/** Quanto já foi pago e quanto falta de uma tatuagem. */
export function saldo(valor: number | null, pagamentos: { valor: number }[]) {
  // Soma em centavos para não acumular erro de arredondamento.
  const pago = pagamentos.reduce((soma, p) => soma + Math.round(Number(p.valor) * 100), 0) / 100;
  return {
    pago,
    falta: valor === null ? null : Math.max(Math.round((Number(valor) - pago) * 100) / 100, 0),
  };
}
