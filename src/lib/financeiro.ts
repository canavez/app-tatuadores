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
  sessao_id: string;
  valor: number;
  data: string;
  tipo: TipoPagamento;
  forma: Forma;
  observacoes: string | null;
  taxa: number;
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

/** Soma valores em reais sem acumular erro de arredondamento (soma em centavos). */
export function somar(valores: (number | null)[]): number {
  return valores.reduce<number>((soma, v) => soma + Math.round(Number(v ?? 0) * 100), 0) / 100;
}

/**
 * Quanto já foi pago e quanto falta de uma sessão.
 * Sessão cancelada ou em que o cliente faltou não tem nada a receber
 * (o que foi pago, como o sinal, continua contando como recebido).
 */
export function saldoSessao(sessao: {
  valor: number | null;
  status: string;
  pagamentos: { valor: number }[];
}) {
  const pago = somar(sessao.pagamentos.map((p) => p.valor));
  const conta = sessao.status !== "cancelado" && sessao.status !== "faltou";
  return {
    pago,
    falta:
      sessao.valor === null ? null : conta ? Math.max(somar([sessao.valor, -pago]), 0) : 0,
  };
}

export const CATEGORIAS = {
  material: "Material",
  aluguel: "Aluguel",
  divulgacao: "Divulgação",
  equipamento: "Equipamento",
  outros: "Outros",
} as const;

export type Categoria = keyof typeof CATEGORIAS;

export function ehCategoria(valor: unknown): valor is Categoria {
  return typeof valor === "string" && valor in CATEGORIAS;
}

/** Percentuais configurados na Conta (0 quando ainda não configurado). */
export type Configuracoes = {
  taxa_debito: number;
  taxa_credito: number;
  taxa_pix: number;
  comissao_estudio: number;
};

export const SEM_CONFIGURACAO: Configuracoes = {
  taxa_debito: 0,
  taxa_credito: 0,
  taxa_pix: 0,
  comissao_estudio: 0,
};

/** Lê um percentual digitado ("3,5", "3.5", "3,5%"). Vazio vale 0; inválido devolve null. */
export function lerPercentual(texto: string | null): number | null {
  if (!texto) return 0;
  const limpo = texto.replace(/[%\s]/g, "").replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return null;
  const valor = Number(limpo);
  return valor <= 100 ? valor : null;
}

/** 3.5 → "3,5" para preencher um campo. */
export function percentualParaCampo(valor: number): string {
  return Number(valor) === 0 ? "" : String(Number(valor)).replace(".", ",");
}

/** Taxa da maquininha, em reais, de um pagamento com essa forma e valor. */
export function taxaDoPagamento(config: Configuracoes, forma: Forma, valor: number): number {
  const percentual =
    forma === "debito"
      ? config.taxa_debito
      : forma === "credito"
        ? config.taxa_credito
        : forma === "pix"
          ? config.taxa_pix
          : 0;
  return Math.round(valor * Number(percentual)) / 100;
}
