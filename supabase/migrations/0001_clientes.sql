-- Clientes de cada tatuador.
-- RLS garante que cada tatuador só enxerga e altera os próprios clientes.

create table public.clientes (
  id              uuid primary key default gen_random_uuid(),
  tatuador_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome            text not null check (length(trim(nome)) > 0),
  telefone        text,
  email           text,
  instagram       text,
  cpf             text,
  data_nascimento date,
  observacoes     text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index clientes_tatuador_nome_idx on public.clientes (tatuador_id, nome);

alter table public.clientes enable row level security;

create policy "tatuador vê os próprios clientes"
  on public.clientes for select
  using (tatuador_id = auth.uid());

create policy "tatuador cadastra os próprios clientes"
  on public.clientes for insert
  with check (tatuador_id = auth.uid());

create policy "tatuador edita os próprios clientes"
  on public.clientes for update
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

create policy "tatuador exclui os próprios clientes"
  on public.clientes for delete
  using (tatuador_id = auth.uid());

-- Mantém atualizado_em em dia.
create function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger clientes_atualizado_em
  before update on public.clientes
  for each row execute function public.tocar_atualizado_em();
