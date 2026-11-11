import { createSign } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUTO_GOOGLE } from "@/lib/empresa";

// Mensalidade do Ravenn pelo app de Android (compra dentro do Google Play). Só no servidor.
// A compra chega por dois caminhos, e os dois passam por aqui:
// 1. o app manda o "token" da compra assim que a pessoa paga (/api/google/compra);
// 2. o Google avisa renovações, cancelamentos e reembolsos (/api/google/notificacoes).
// O token sozinho não vale nada: a situação da assinatura é sempre perguntada ao próprio
// Google (Google Play Developer API), com a conta de serviço do Ravenn.

const PACOTE = "me.ravenn.app";
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACOTE}`;

type ContaServico = { client_email: string; private_key: string };

/** JSON da conta de serviço (Google Cloud → Contas de serviço → Chaves), puro ou em base64. */
function contaServico(): ContaServico {
  const bruto = process.env.GOOGLE_PLAY_CONTA_SERVICO?.trim();
  if (!bruto) throw new Error("Falta GOOGLE_PLAY_CONTA_SERVICO no .env.local / na Vercel.");
  const texto = bruto.startsWith("{") ? bruto : Buffer.from(bruto, "base64").toString("utf8");
  const conta = JSON.parse(texto) as ContaServico;
  if (!conta.client_email || !conta.private_key) throw new Error("GOOGLE_PLAY_CONTA_SERVICO incompleta.");
  return conta;
}

const b64url = (dados: string | Buffer) => Buffer.from(dados).toString("base64url");

let acesso: { token: string; vence: number } | null = null;

/** Token de acesso (OAuth) da conta de serviço, guardado até perto de vencer. */
async function tokenDeAcesso() {
  if (acesso && acesso.vence > Date.now() + 60_000) return acesso.token;
  const conta = contaServico();
  const agora = Math.floor(Date.now() / 1000);
  const cabecalho = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corpo = b64url(
    JSON.stringify({
      iss: conta.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: agora,
      exp: agora + 3600,
    }),
  );
  const assinatura = createSign("RSA-SHA256").update(`${cabecalho}.${corpo}`).sign(conta.private_key);
  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${cabecalho}.${corpo}.${b64url(assinatura)}`,
    }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !dados.access_token) {
    throw new Error(`Google recusou a conta de serviço: ${dados.error_description ?? resposta.status}`);
  }
  acesso = { token: dados.access_token, vence: Date.now() + (dados.expires_in ?? 3600) * 1000 };
  return acesso.token;
}

/** O token não é de uma compra deste app (inventado, de outro app ou apagado). */
export class TokenInvalido extends Error {}

/** A compra é de outra conta do Ravenn (mesma conta Google, contas do Ravenn diferentes). */
export class CompraDeOutraConta extends Error {}

/** Resposta de purchases.subscriptionsv2.get (só o que o Ravenn usa). */
type AssinaturaGoogle = {
  subscriptionState?: string;
  linkedPurchaseToken?: string;
  acknowledgementState?: string;
  testPurchase?: object;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  lineItems?: { productId?: string; expiryTime?: string; autoRenewingPlan?: { autoRenewEnabled?: boolean } }[];
};

async function buscar(token: string): Promise<AssinaturaGoogle> {
  const resposta = await fetch(`${API}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${await tokenDeAcesso()}` },
    cache: "no-store",
  });
  if (resposta.status === 400 || resposta.status === 404 || resposta.status === 410) throw new TokenInvalido();
  if (!resposta.ok) throw new Error(`Google Play respondeu ${resposta.status}: ${await resposta.text()}`);
  return resposta.json();
}

/**
 * Confirma a compra no Google (o app já confirma sozinho; isto é a garantia).
 * Sem confirmação em 3 dias o Google devolve o dinheiro e cancela.
 */
async function confirmar(token: string) {
  const resposta = await fetch(
    `${API}/purchases/subscriptions/${encodeURIComponent(PRODUTO_GOOGLE)}/tokens/${encodeURIComponent(token)}:acknowledge`,
    { method: "POST", headers: { Authorization: `Bearer ${await tokenDeAcesso()}` } },
  );
  if (!resposta.ok) console.error("Confirmar compra do Google:", resposta.status, await resposta.text());
}

function statusDa(a: AssinaturaGoogle, revogada: boolean) {
  if (revogada) return "reembolsada";
  const renova = a.lineItems?.[0]?.autoRenewingPlan?.autoRenewEnabled !== false;
  switch (a.subscriptionState) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return renova ? "ativa" : "cancelada";
    case "SUBSCRIPTION_STATE_CANCELED":
      return "cancelada";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
    case "SUBSCRIPTION_STATE_ON_HOLD":
      return "cobranca_falhou";
    case "SUBSCRIPTION_STATE_PAUSED":
      return "pausada";
    case "SUBSCRIPTION_STATE_PENDING":
      return "pendente";
    default:
      return "expirada";
  }
}

/**
 * Pergunta ao Google a situação da assinatura e copia para a tabela "assinaturas".
 * `tatuadorId` vem do login quando é o próprio app que manda a compra; nos avisos do Google
 * o tatuador é achado pelo token (ou o token anterior, quando a pessoa assinou de novo) ou
 * pelo id da conta gravado na compra. `revogada`: o Google avisou reembolso com cancelamento.
 * Pode ser chamada quantas vezes quiser e em qualquer ordem.
 */
export async function sincronizarGoogle(token: string, tatuadorId?: string, revogada = false) {
  const assinatura = await buscar(token);
  const item = assinatura.lineItems?.find((l) => l.productId === PRODUTO_GOOGLE);
  if (!item) return null;
  const contaDaCompra = assinatura.externalAccountIdentifiers?.obfuscatedExternalAccountId?.toLowerCase();
  if (tatuadorId && contaDaCompra && contaDaCompra !== tatuadorId.toLowerCase()) throw new CompraDeOutraConta();

  const admin = createAdminClient();
  const campos = "tatuador_id, pago_ate, origem, google_token";
  const tokens = [token, assinatura.linkedPurchaseToken].filter((t): t is string => Boolean(t));
  const { data: donos } = await admin.from("assinaturas").select(campos).in("google_token", tokens);
  const dono = donos?.find((d) => d.google_token === token) ?? donos?.[0];
  if (tatuadorId && dono && dono.google_token === token && dono.tatuador_id !== tatuadorId) {
    throw new CompraDeOutraConta();
  }

  const id = tatuadorId ?? dono?.tatuador_id ?? contaDaCompra;
  if (!id) return null;
  const { data: linha } =
    dono && dono.tatuador_id === id
      ? { data: dono }
      : await admin.from("assinaturas").select(campos).eq("tatuador_id", id).maybeSingle();
  if (!linha) return null; // conta excluída

  const status = statusDa(assinatura, revogada);
  const mudancas: Record<string, string | null> = {
    google_token: token,
    google_produto: item.productId ?? PRODUTO_GOOGLE,
    google_status: status,
    google_ambiente: assinatura.testPurchase ? "teste" : "producao",
    atualizado_em: new Date().toISOString(),
  };

  if (revogada) {
    // Reembolsada e cancelada pelo Google: o acesso pago por ele acaba agora.
    const agora = new Date().toISOString();
    if (linha.origem === "google" && linha.pago_ate && linha.pago_ate > agora) mudancas.pago_ate = agora;
  } else if (item.expiryTime && status !== "pendente") {
    // Pago até o fim do mês (ou da carência, quando a cobrança falhou e o Google ainda tenta).
    const ate = new Date(item.expiryTime).toISOString();
    // Nunca encurta: avisos antigos podem chegar depois dos novos, e um acesso maior
    // pago pelo site, pela Apple ou de cortesia continua valendo.
    if (!linha.pago_ate || linha.pago_ate < ate) {
      mudancas.pago_ate = ate;
      mudancas.origem = "google";
    }
  }

  const { error } = await admin.from("assinaturas").update(mudancas).eq("tatuador_id", linha.tatuador_id);
  if (error) throw new Error(`Não foi possível salvar a assinatura do Google: ${error.message}`);
  if (assinatura.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING" && status !== "pendente") {
    await confirmar(token);
  }
  return { ate: mudancas.pago_ate ?? linha.pago_ate, status };
}
