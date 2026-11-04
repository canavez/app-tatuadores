-- Pagamento da mensalidade pelo app do iPhone (compra dentro da App Store).
-- Quem escreve aqui é só o servidor (com a chave secreta do Supabase), nunca o app.
-- O bloqueio continua olhando só "pago_ate" (0014). Pode ser rodado de novo sem problema.

alter table public.assinaturas
  -- Número da assinatura na Apple (não muda nas renovações). Uma assinatura da Apple
  -- só pode estar ligada a uma conta do Ravenn.
  add column if not exists apple_transacao_original text unique,
  add column if not exists apple_produto            text,
  -- ativa, cancelada (renovação desligada), cobranca_falhou, expirada, reembolsada
  add column if not exists apple_status             text,
  -- Production ou Sandbox (compras de teste do TestFlight)
  add column if not exists apple_ambiente           text;
