-- Estoque de materiais (sem lote/validade): quantidade atual e estoque mínimo.
-- Quando a quantidade chega no mínimo, o item aparece como "acabando".
-- Pode ser rodado de novo sem problema.

create table if not exists public.itens_estoque (
  id              uuid primary key default gen_random_uuid(),
  tatuador_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome            text not null check (length(trim(nome)) > 0),
  categoria       text not null default 'outros'
                  check (categoria in ('cartuchos', 'agulhas', 'biqueiras', 'tintas', 'luvas',
                                       'descartaveis', 'decalque', 'higiene', 'outros')),
  quantidade      integer not null default 0 check (quantidade >= 0),
  unidade         text not null default 'un',
  estoque_minimo  integer not null default 0 check (estoque_minimo >= 0),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  unique (tatuador_id, nome)
);

alter table public.itens_estoque enable row level security;

drop trigger if exists itens_estoque_atualizado_em on public.itens_estoque;
create trigger itens_estoque_atualizado_em
  before update on public.itens_estoque
  for each row execute function public.tocar_atualizado_em();

drop policy if exists "tatuador vê o próprio estoque" on public.itens_estoque;
create policy "tatuador vê o próprio estoque"
  on public.itens_estoque for select
  using (tatuador_id = auth.uid());

drop policy if exists "tatuador cadastra itens no próprio estoque" on public.itens_estoque;
create policy "tatuador cadastra itens no próprio estoque"
  on public.itens_estoque for insert
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador edita o próprio estoque" on public.itens_estoque;
create policy "tatuador edita o próprio estoque"
  on public.itens_estoque for update
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador exclui itens do próprio estoque" on public.itens_estoque;
create policy "tatuador exclui itens do próprio estoque"
  on public.itens_estoque for delete
  using (tatuador_id = auth.uid());

-- Soma (ou subtrai) da quantidade sem deixar negativa, numa única operação.
create or replace function public.ajustar_estoque(item uuid, delta integer)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.itens_estoque
  set quantidade = greatest(quantidade + delta, 0)
  where id = item and tatuador_id = auth.uid();
$$;
