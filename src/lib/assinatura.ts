import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { situacaoDa, type Assinatura } from "./assinatura-regras";

export * from "./assinatura-regras";

/** Situação da assinatura de quem está logado (uma consulta por requisição). */
export const buscarAssinatura = cache(async (): Promise<Assinatura | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assinaturas")
    .select("teste_ate, pago_ate, origem")
    .maybeSingle();
  // Sem a linha (ou sem a tabela ainda): não bloqueia ninguém por engano.
  if (error || !data) return null;
  return situacaoDa(data);
});

/** Dados do Stripe de quem está logado (para mostrar "Gerenciar assinatura"). */
export const buscarStripe = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assinaturas")
    .select("stripe_customer_id, stripe_subscription_id, stripe_status")
    .maybeSingle();
  return {
    temCliente: Boolean(data?.stripe_customer_id),
    temAssinatura: Boolean(data?.stripe_subscription_id),
    status: (data?.stripe_status as string | null) ?? null,
  };
});
