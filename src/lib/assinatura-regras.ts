// Regras da assinatura (sem banco): usadas no proxy e nas telas.

export type Assinatura =
  | { situacao: "teste"; ate: string; dias: number }
  | { situacao: "ativa"; ate: string; origem: string | null }
  | { situacao: "vencida"; desde: string };

/** Telas que continuam abertas com a assinatura vencida (assinar, conta e os próprios dados). */
export const LIVRES_SEM_ASSINATURA = ["/assinatura", "/conta", "/financeiro/relatorio", "/api/apple/compra", "/api/google/compra"];

const DIA_MS = 86_400_000;

export function situacaoDa(
  linha: { teste_ate: string; pago_ate: string | null; origem: string | null },
  agora = new Date(),
): Assinatura {
  if (linha.pago_ate && new Date(linha.pago_ate) > agora) {
    return { situacao: "ativa", ate: linha.pago_ate, origem: linha.origem };
  }
  if (new Date(linha.teste_ate) > agora) {
    const dias = Math.ceil((new Date(linha.teste_ate).getTime() - agora.getTime()) / DIA_MS);
    return { situacao: "teste", ate: linha.teste_ate, dias };
  }
  const desde = linha.pago_ate && linha.pago_ate > linha.teste_ate ? linha.pago_ate : linha.teste_ate;
  return { situacao: "vencida", desde };
}
