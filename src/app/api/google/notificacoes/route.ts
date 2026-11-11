import { timingSafeEqual } from "node:crypto";
import { sincronizarGoogle, TokenInvalido } from "@/lib/google";

// Endereço que o Google chama a cada mudança na assinatura (notificações em tempo real do
// Google Play, entregues pelo Google Cloud Pub/Sub no modo "push"): assinou, renovou, cancelou,
// cobrança falhou, expirou, reembolso.
// Cadastre no Pub/Sub: https://ravenn.me/api/google/notificacoes?chave=<GOOGLE_PLAY_CHAVE_AVISOS>
// Fica aberto sem login (ver ROTAS_PUBLICAS no proxy). O aviso só traz o token: a situação
// é sempre perguntada ao Google, então um aviso falso não libera nada.

// Tipos de aviso que tiram o acesso na hora (reembolso com cancelamento).
const REVOGADA = 12; // SUBSCRIPTION_REVOKED

function chaveConfere(recebida: string | null) {
  const esperada = process.env.GOOGLE_PLAY_CHAVE_AVISOS;
  if (!esperada) return true;
  if (!recebida || recebida.length !== esperada.length) return false;
  return timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada));
}

export async function POST(request: Request) {
  if (!chaveConfere(new URL(request.url).searchParams.get("chave"))) {
    return new Response("Chave inválida", { status: 403 });
  }
  const corpo = await request.json().catch(() => null);
  const dados = corpo?.message?.data;
  if (typeof dados !== "string") return new Response("Sem aviso", { status: 400 });

  let aviso;
  try {
    aviso = JSON.parse(Buffer.from(dados, "base64").toString("utf8"));
  } catch {
    return new Response("Aviso ilegível", { status: 400 });
  }

  const assinatura = aviso?.subscriptionNotification;
  const reembolso = aviso?.voidedPurchaseNotification;
  const token: unknown = assinatura?.purchaseToken ?? reembolso?.purchaseToken;
  // Aviso de teste do Play Console ou de compra avulsa: nada a fazer.
  if (typeof token !== "string") return Response.json({ recebido: true });

  try {
    await sincronizarGoogle(token, undefined, assinatura?.notificationType === REVOGADA || Boolean(reembolso));
  } catch (erro) {
    // Token que o Google não reconhece: não adianta tentar de novo.
    if (erro instanceof TokenInvalido) return Response.json({ recebido: true });
    // Erro 500 faz o Pub/Sub tentar de novo mais tarde.
    console.error("Aviso do Google:", assinatura?.notificationType ?? "reembolso", erro);
    return new Response("Erro ao processar", { status: 500 });
  }

  return Response.json({ recebido: true });
}
