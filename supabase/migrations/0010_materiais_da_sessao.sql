-- Materiais usados em cada sessão (cartuchos, agulhas, biqueiras).
-- O estoque é ajustado sozinho pelos gatilhos: registrar desconta, corrigir
-- ajusta a diferença e apagar (inclusive ao excluir a sessão) devolve.
-- Pode ser rodado de novo sem problema.

create table if not exists public.sessao_materiais (
  sessao_id    uuid not null references public.sessoes (id) on delete cascade,
  item_id      uuid not null references public.itens_estoque (id) on delete cascade,
  tatuador_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quantidade   integer not null check (quantidade > 0),
  primary key (sessao_id, item_id)
);

alter table public.sessao_materiais enable row level security;

drop policy if exists "tatuador vê os materiais das próprias sessões" on public.sessao_materiais;
create policy "tatuador vê os materiais das próprias sessões"
  on public.sessao_materiais for select
  using (tatuador_id = auth.uid());

drop policy if exists "tatuador registra materiais das próprias sessões" on public.sessao_materiais;
create policy "tatuador registra materiais das próprias sessões"
  on public.sessao_materiais for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.sessoes s where s.id = sessao_id and s.tatuador_id = auth.uid())
    and exists (select 1 from public.itens_estoque i where i.id = item_id and i.tatuador_id = auth.uid())
  );

drop policy if exists "tatuador corrige materiais das próprias sessões" on public.sessao_materiais;
create policy "tatuador corrige materiais das próprias sessões"
  on public.sessao_materiais for update
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador apaga materiais das próprias sessões" on public.sessao_materiais;
create policy "tatuador apaga materiais das próprias sessões"
  on public.sessao_materiais for delete
  using (tatuador_id = auth.uid());

create or replace function public.estoque_segue_materiais()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  usado integer;
begin
  if tg_op = 'INSERT' then
    usado := new.quantidade;
  elsif tg_op = 'UPDATE' then
    usado := new.quantidade - old.quantidade;
  else
    usado := -old.quantidade;
  end if;

  update public.itens_estoque
  set quantidade = greatest(quantidade - usado, 0)
  where id = coalesce(new.item_id, old.item_id);

  return null;
end;
$$;

drop trigger if exists sessao_materiais_estoque on public.sessao_materiais;
create trigger sessao_materiais_estoque
  after insert or update or delete on public.sessao_materiais
  for each row execute function public.estoque_segue_materiais();
