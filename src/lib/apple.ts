import {
  AutoRenewStatus,
  Environment,
  SignedDataVerifier,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { RAIZES_APPLE } from "@/lib/apple-raizes";
import { PRODUTO_APPLE } from "@/lib/empresa";

// Mensalidade do Ravenn pelo app do iPhone (compra dentro da App Store). Só no servidor.
// A compra chega por dois caminhos, e os dois passam por aqui:
// 1. o app manda a compra assim que a pessoa paga (/api/apple/compra);
// 2. a Apple avisa renovações, cancelamentos e reembolsos (/api/apple/notificacoes).
// Tudo que chega é assinado pela Apple e conferido com os certificados dela antes de valer.

const BUNDLE_ID = "me.ravenn.app";

const verificadores = new Map<Environment, SignedDataVerifier>();

function verificador(ambiente: Environment) {
  let v = verificadores.get(ambiente);
  if (!v) {
    // O número do app (App Store Connect → Informações do app → Apple ID) só é exigido em produção.
    const appId = Number(process.env.APPLE_APP_ID) || undefined;
    if (ambiente === Environment.PRODUCTION && !appId) {
      throw new Error("Falta APPLE_APP_ID no .env.local / na Vercel.");
    }
    v = new SignedDataVerifier(
      RAIZES_APPLE.map((b64) => Buffer.from(b64, "base64")),
      true,
      ambiente,
      BUNDLE_ID,
      ambiente === Environment.PRODUCTION ? appId : undefined,
    );
    verificadores.set(ambiente, v);
  }
  return v;
}

/**
 * Confere uma informação assinada pela Apple. Aceita produção e teste (Sandbox): as compras
 * do TestFlight e as da equipe de revisão da Apple são de teste, mesmo com o app publicado.
 * Para recusar as de teste no futuro: APPLE_SO_PRODUCAO=1 na Vercel.
 */
async function conferir<T>(decodificar: (v: SignedDataVerifier) => Promise<T>): Promise<T> {
  const ambientes =
    process.env.APPLE_SO_PRODUCAO === "1"
      ? [Environment.PRODUCTION]
      : [Environment.PRODUCTION, Environment.SANDBOX];
  let ultimoErro: unknown;
  for (const ambiente of ambientes) {
    try {
      return await decodificar(verificador(ambiente));
    } catch (erro) {
      ultimoErro = erro;
    }
  }
  throw ultimoErro;
}

export const conferirTransacao = (jws: string) => conferir((v) => v.verifyAndDecodeTransaction(jws));
export const conferirRenovacao = (jws: string) => conferir((v) => v.verifyAndDecodeRenewalInfo(jws));
export const conferirNotificacao = (jws: string) => conferir((v) => v.verifyAndDecodeNotification(jws));

/** A compra é de outra conta do Ravenn (mesmo ID Apple, contas diferentes). */
export class CompraDeOutraConta extends Error {}

const iso = (ms: number) => new Date(ms).toISOString();

function statusDa(tx: JWSTransactionDecodedPayload, renovacao?: JWSRenewalInfoDecodedPayload) {
  if (tx.revocationDate) return "reembolsada";
  const fim = Math.max(tx.expiresDate ?? 0, renovacao?.gracePeriodExpiresDate ?? 0);
  if (fim <= Date.now()) return "expirada";
  if (renovacao?.isInBillingRetryPeriod) return "cobranca_falhou";
  if (renovacao?.autoRenewStatus === AutoRenewStatus.OFF) return "cancelada";
  return "ativa";
}

/**
 * Copia uma compra (ou renovação) da Apple para a tabela "assinaturas".
 * `tatuadorId` vem do login quando é o próprio app que manda a compra; nos avisos da Apple
 * o tatuador é achado pelo número da assinatura ou pelo appAccountToken (o id dele, gravado
 * na compra). Pode ser chamada quantas vezes quiser e em qualquer ordem.
 */
export async function sincronizarApple(
  tx: JWSTransactionDecodedPayload,
  renovacao?: JWSRenewalInfoDecodedPayload,
  tatuadorId?: string,
) {
  if (tx.productId !== PRODUTO_APPLE || !tx.originalTransactionId) return null;
  const original = tx.originalTransactionId;
  const token = tx.appAccountToken?.toLowerCase();

  if (tatuadorId && token && token !== tatuadorId.toLowerCase()) throw new CompraDeOutraConta();

  const admin = createAdminClient();
  const campos = "tatuador_id, pago_ate, origem";
  const { data: dono } = await admin
    .from("assinaturas")
    .select(campos)
    .eq("apple_transacao_original", original)
    .maybeSingle();
  if (tatuadorId && dono && dono.tatuador_id !== tatuadorId) throw new CompraDeOutraConta();

  const id = tatuadorId ?? dono?.tatuador_id ?? token;
  if (!id) return null;
  const { data: linha } =
    dono && dono.tatuador_id === id
      ? { data: dono }
      : await admin.from("assinaturas").select(campos).eq("tatuador_id", id).maybeSingle();
  if (!linha) return null; // conta excluída

  const status = statusDa(tx, renovacao);
  const mudancas: Record<string, string | null> = {
    apple_transacao_original: original,
    apple_produto: tx.productId,
    apple_status: status,
    apple_ambiente: tx.environment ? String(tx.environment) : null,
    atualizado_em: new Date().toISOString(),
  };

  if (tx.revocationDate) {
    // Reembolsada pela Apple: o acesso pago por ela acaba na data do reembolso.
    const ate = iso(tx.revocationDate);
    if (linha.origem === "apple" && linha.pago_ate && linha.pago_ate > ate) mudancas.pago_ate = ate;
  } else {
    // Pago até o fim do mês (ou da carência, quando a cobrança falhou e a Apple ainda tenta).
    const ate = iso(Math.max(tx.expiresDate ?? 0, renovacao?.gracePeriodExpiresDate ?? 0));
    // Nunca encurta: avisos antigos podem chegar depois dos novos, e um acesso maior
    // pago pelo site ou de cortesia continua valendo.
    if (!linha.pago_ate || linha.pago_ate < ate) {
      mudancas.pago_ate = ate;
      mudancas.origem = "apple";
    }
  }

  const { error } = await admin.from("assinaturas").update(mudancas).eq("tatuador_id", linha.tatuador_id);
  if (error) throw new Error(`Não foi possível salvar a assinatura da Apple: ${error.message}`);
  return { ate: mudancas.pago_ate ?? linha.pago_ate, status };
}
