-- Agenda: cada tatuagem (projeto) pertence a um cliente e pode ter várias sessões.
-- O próprio banco impede duas sessões do mesmo tatuador com horários sobrepostos.

create extension if not exists btree_gist with schema extensions;

create table public.tatuagens (
  id            uuid primary key default gen_random_uuid(),
  tatuador_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id    uuid not null references public.clientes (id) on delete cascade,
  descricao     text not null check (length(trim(descricao)) > 0),
  local_corpo   text,
  observacoes   text,
  criado_em     timestamptz not null default now()
);

create index tatuagens_cliente_idx on public.tatuagens (cliente_id);

create table public.sessoes (
  id            uuid primary key default gen_random_uuid(),
  tatuador_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tatuagem_id   uuid not null references public.tatuagens (id) on delete cascade,
  inicio        timestamptz not null,
  fim           timestamptz not null,
  status        text not null default 'agendado'
                check (status in ('agendado', 'confirmado', 'realizado', 'faltou', 'cancelado')),
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim > inicio),
  -- Sessões canceladas liberam o horário.
  constraint sessoes_sem_conflito exclude using gist (
    tatuador_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status <> 'cancelado')
);

create index sessoes_tatuagem_idx on public.sessoes (tatuagem_id);

create trigger sessoes_atualizado_em
  before update on public.sessoes
  for each row execute function public.tocar_atualizado_em();

-- Segurança: cada tatuador só acessa os próprios dados,
-- e só pode ligar registros a clientes/tatuagens que também são dele.

alter table public.tatuagens enable row level security;
alter table public.sessoes enable row level security;

create policy "tatuador vê as próprias tatuagens"
  on public.tatuagens for select
  using (tatuador_id = auth.uid());

create policy "tatuador cadastra tatuagens dos próprios clientes"
  on public.tatuagens for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.clientes c where c.id = cliente_id and c.tatuador_id = auth.uid())
  );

create policy "tatuador edita as próprias tatuagens"
  on public.tatuagens for update
  using (tatuador_id = auth.uid())
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.clientes c where c.id = cliente_id and c.tatuador_id = auth.uid())
  );

create policy "tatuador exclui as próprias tatuagens"
  on public.tatuagens for delete
  using (tatuador_id = auth.uid());

create policy "tatuador vê as próprias sessões"
  on public.sessoes for select
  using (tatuador_id = auth.uid());

create policy "tatuador cadastra sessões das próprias tatuagens"
  on public.sessoes for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.tatuagens t where t.id = tatuagem_id and t.tatuador_id = auth.uid())
  );

create policy "tatuador edita as próprias sessões"
  on public.sessoes for update
  using (tatuador_id = auth.uid())
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.tatuagens t where t.id = tatuagem_id and t.tatuador_id = auth.uid())
  );

create policy "tatuador exclui as próprias sessões"
  on public.sessoes for delete
  using (tatuador_id = auth.uid());
