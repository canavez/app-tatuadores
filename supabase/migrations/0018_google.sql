-- Pagamento da mensalidade pelo app de Android (compra dentro do Google Play).
-- Quem escreve aqui é só o servidor (com a chave secreta do Supabase), nunca o app.
-- O bloqueio continua olhando só "pago_ate" (0014). Pode ser rodado de novo sem problema.

alter table public.assinaturas
  -- Token da compra no Google Play (não muda nas renovações; muda se a pessoa assinar de novo
  -- depois de expirar). Uma assinatura do Google só pode estar ligada a uma conta do Ravenn.
  add column if not exists google_token    text unique,
  add column if not exists google_produto  text,
  -- ativa, cancelada (renovação desligada), cobranca_falhou, pausada, pendente, expirada, reembolsada
  add column if not exists google_status   text,
  -- producao ou teste (compras de testadores cadastrados no Play Console)
  add column if not exists google_ambiente text;

-- "origem" do acesso pago ganha o Google.
alter table public.assinaturas drop constraint if exists assinaturas_origem_check;
alter table public.assinaturas
  add constraint assinaturas_origem_check check (origem in ('apple', 'google', 'web', 'cortesia'));
