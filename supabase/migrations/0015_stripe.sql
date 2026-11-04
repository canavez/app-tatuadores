-- Pagamento da mensalidade pelo site, com o Stripe.
-- Guarda quem é o tatuador no Stripe e a situação da assinatura de lá. Quem escreve
-- aqui é só o servidor (webhook do Stripe, com a chave secreta do Supabase), nunca o app.
-- O bloqueio continua olhando só "pago_ate" (0014). Pode ser rodado de novo sem problema.

alter table public.assinaturas
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text,
  -- active, trialing, past_due, canceled... (como o Stripe chama)
  add column if not exists stripe_status          text;
