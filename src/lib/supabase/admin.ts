import { createClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase com a chave secreta (service role): passa por cima do RLS.
 * SÓ no servidor (webhook do Stripe e ações de assinatura). Nunca importe em tela "use client".
 */
export function createAdminClient() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no .env.local / na Vercel.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
