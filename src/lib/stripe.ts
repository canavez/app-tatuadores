import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Mensalidade do Ravenn pelo site, com o Stripe (Checkout + Portal do cliente + webhook).
// Só no servidor. As chaves ficam no .env.local (e na Vercel), nunca no código.

let cliente: Stripe | undefined;

export function stripe() {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) throw new Error("Falta STRIPE_SECRET_KEY no .env.local / na Vercel.");
  cliente ??= new Stripe(chave);
  return cliente;
}

export function precoStripe() {
  const preco = process.env.STRIPE_PRICE_ID;
  if (!preco) throw new Error("Falta STRIPE_PRICE_ID no .env.local / na Vercel.");
  return preco;
}

/** Assinaturas que ainda existem no Stripe (não precisa criar outra; manda para o Portal). */
export const SITUACOES_VIVAS = ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"];

const iso = (segundos: number) => new Date(segundos * 1000).toISOString();

/**
 * Copia a situação de uma assinatura do Stripe para a tabela "assinaturas".
 * Sempre busca a versão mais nova no Stripe (os avisos do webhook podem chegar fora de ordem),
 * então pode ser chamada quantas vezes quiser.
 */
export async function sincronizarAssinatura(assinaturaId: string) {
  const sub = await stripe().subscriptions.retrieve(assinaturaId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const admin = createAdminClient();

  // Acha o tatuador: pelo id gravado na assinatura ou, se não tiver, pelo cliente do Stripe.
  const { data: linha } = sub.metadata.tatuador_id
    ? await admin
        .from("assinaturas")
        .select("tatuador_id, pago_ate, origem")
        .eq("tatuador_id", sub.metadata.tatuador_id)
        .maybeSingle()
    : await admin
        .from("assinaturas")
        .select("tatuador_id, pago_ate, origem")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
  if (!linha) return;

  const mudancas: Record<string, string | null> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_status: sub.status,
    atualizado_em: new Date().toISOString(),
  };

  // Acesso pago até o fim do mês já cobrado (ou do período grátis, se ainda estiver nele).
  const fimDoPeriodo = Math.max(...sub.items.data.map((item) => item.current_period_end));
  // Não encurta um acesso maior que veio de outro lugar (Apple ou cortesia).
  const outraOrigemMaior = (ate: string) =>
    linha.origem !== null && linha.origem !== "web" && linha.pago_ate !== null && linha.pago_ate > ate;

  if (sub.status === "active" || sub.status === "trialing") {
    const ate = iso(sub.status === "trialing" && sub.trial_end ? sub.trial_end : fimDoPeriodo);
    if (!outraOrigemMaior(ate)) {
      mudancas.pago_ate = ate;
      mudancas.origem = "web";
    }
  } else if (
    (sub.status === "canceled" || sub.status === "incomplete_expired") &&
    (linha.origem === "web" || linha.origem === null)
  ) {
    // Cancelada: o acesso vai só até quando terminou (normalmente o fim do mês já pago).
    const terminou = iso(sub.ended_at ?? Math.floor(Date.now() / 1000));
    if (!linha.pago_ate || linha.pago_ate > terminou) mudancas.pago_ate = terminou;
  }
  // past_due / unpaid (cartão recusado): não estende. Quando o mês pago acabar, o app bloqueia
  // e a tela de Assinatura mostra o botão para trocar o cartão.

  const { error } = await admin.from("assinaturas").update(mudancas).eq("tatuador_id", linha.tatuador_id);
  if (error) throw new Error(`Não foi possível salvar a assinatura: ${error.message}`);
}
