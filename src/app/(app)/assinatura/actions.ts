"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITUACOES_VIVAS, precoStripe, stripe } from "@/lib/stripe";

/** Endereço do site que está aberto (ravenn.me, localhost...), para o Stripe voltar para ele. */
async function enderecoDoSite() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/** O tatuador logado e o cliente dele no Stripe (cria na primeira vez). */
async function clienteNoStripe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: linha } = await supabase
    .from("assinaturas")
    .select("teste_ate, stripe_customer_id, stripe_subscription_id, stripe_status")
    .maybeSingle();
  if (!linha) throw new Error("Conta sem linha de assinatura.");

  let customerId: string = linha.stripe_customer_id;
  if (!customerId) {
    const cliente = await stripe().customers.create({
      email: user.email,
      metadata: { tatuador_id: user.id },
    });
    customerId = cliente.id;
    // O tatuador não pode escrever na própria assinatura (RLS): grava com a chave do servidor.
    const { error } = await createAdminClient()
      .from("assinaturas")
      .update({ stripe_customer_id: customerId })
      .eq("tatuador_id", user.id);
    if (error) throw new Error(`Não foi possível salvar o cliente do Stripe: ${error.message}`);
  }
  return { user, linha, customerId };
}

const DOIS_DIAS_MS = 2 * 86_400_000;

/** Botão "Assinar": abre a página de pagamento do Stripe. */
export async function assinar() {
  const { user, linha, customerId } = await clienteNoStripe();
  const site = await enderecoDoSite();

  // Já tem assinatura no Stripe (ex.: cartão recusado): não cria outra, abre o Portal.
  if (linha.stripe_subscription_id && SITUACOES_VIVAS.includes(linha.stripe_status ?? "")) {
    const portal = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${site}/assinatura`,
    });
    redirect(portal.url);
  }

  // Ainda no período grátis: só cobra quando ele acabar (o Stripe exige pelo menos 2 dias).
  const fimDoTeste = new Date(linha.teste_ate).getTime();
  const trial_end = fimDoTeste - Date.now() > DOIS_DIAS_MS ? Math.floor(fimDoTeste / 1000) : undefined;

  const sessao = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: precoStripe(), quantity: 1 }],
    subscription_data: { metadata: { tatuador_id: user.id }, ...(trial_end && { trial_end }) },
    locale: "pt-BR",
    success_url: `${site}/assinatura?sessao={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/assinatura`,
  });
  redirect(sessao.url!);
}

/** Botão "Gerenciar assinatura": Portal do Stripe para trocar cartão, ver faturas ou cancelar. */
export async function gerenciar() {
  const { customerId } = await clienteNoStripe();
  const portal = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${await enderecoDoSite()}/assinatura`,
  });
  redirect(portal.url);
}
