-- Assinatura de cada tatuador: período grátis e, depois, a mensalidade.
-- Uma linha por conta, criada sozinha no cadastro (30 dias grátis).
-- O tatuador só LÊ a própria linha: quem estende o acesso é o sistema de pagamento
-- (com a chave secreta, que passa por cima do RLS). Pode ser rodado de novo sem problema.

create table if not exists public.assinaturas (
  tatuador_id    uuid primary key references auth.users (id) on delete cascade,
  -- Fim do período grátis.
  teste_ate      timestamptz not null default (now() + interval '30 days'),
  -- Até quando a mensalidade está paga (vazio = nunca assinou).
  pago_ate       timestamptz,
  -- De onde veio o pagamento: 'apple', 'web' ou 'cortesia'.
  origem         text check (origem in ('apple', 'web', 'cortesia')),
  atualizado_em  timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

drop policy if exists "tatuador vê a própria assinatura" on public.assinaturas;
create policy "tatuador vê a própria assinatura"
  on public.assinaturas for select
  using (tatuador_id = auth.uid());
-- Sem políticas de insert/update/delete: ninguém estende o próprio acesso pelo app.

-- Toda conta nova ganha a linha com o período grátis.
create or replace function public.criar_assinatura()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.assinaturas (tatuador_id) values (new.id)
  on conflict (tatuador_id) do nothing;
  return new;
end;
$$;

drop trigger if exists criar_assinatura on auth.users;
create trigger criar_assinatura
  after insert on auth.users
  for each row execute function public.criar_assinatura();

-- Contas que já existiam: começam o período grátis agora.
insert into public.assinaturas (tatuador_id)
select id from auth.users
on conflict (tatuador_id) do nothing;
