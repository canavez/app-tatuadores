import type Stripe from "stripe";
import { sincronizarAssinatura, stripe } from "@/lib/stripe";

// Endereço que o Stripe chama a cada mudança de assinatura (assinou, renovou, cartão
// recusado, cancelou). Cadastre no painel do Stripe: https://ravenn.me/api/stripe/webhook
// Fica aberto sem login (ver ROTAS_PUBLICAS no proxy); quem garante que é o Stripe é a assinatura.

export async function POST(request: Request) {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  const assinatura = request.headers.get("stripe-signature");
  if (!segredo || !assinatura) return new Response("Sem assinatura", { status: 400 });

  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(await request.text(), assinatura, segredo);
  } catch {
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        const sessao = evento.data.object;
        if (sessao.mode === "subscription" && sessao.subscription) {
          await sincronizarAssinatura(
            typeof sessao.subscription === "string" ? sessao.subscription : sessao.subscription.id,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await sincronizarAssinatura(evento.data.object.id);
        break;
    }
  } catch (erro) {
    // Erro 500 faz o Stripe tentar de novo mais tarde.
    console.error("Webhook do Stripe:", erro);
    return new Response("Erro ao processar", { status: 500 });
  }

  return Response.json({ recebido: true });
}
