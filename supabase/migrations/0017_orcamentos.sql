-- Página pública do tatuador (ravenn.me/<link>) e os pedidos de orçamento que chegam por ela.
-- Quem visita a página não tem conta: pode LER o perfil público e ENVIAR um orçamento
-- (com imagens de referência), mas nunca ler os orçamentos de ninguém.
-- Pode ser rodado de novo sem problema.

-- ── Perfil público ────────────────────────────────────────────────────────────
create table if not exists public.perfis (
  tatuador_id   uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- O link: ravenn.me/<slug>. Letras minúsculas, números, ponto, hífen e sublinhado.
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$'),
  -- Nome que aparece na página (o nome profissional).
  nome          text not null check (length(trim(nome)) > 0),
  -- Texto curto de apresentação (estilo, cidade, etc.).
  bio           text check (length(bio) <= 500),
  -- Caminho da foto de perfil no espaço "fotos" (cópia do que está na Conta).
  foto          text,
  -- Desligado: a página mostra que não está recebendo pedidos.
  aceitando     boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

drop policy if exists "perfil é público" on public.perfis;
create policy "perfil é público"
  on public.perfis for select to anon, authenticated
  using (true);

drop policy if exists "tatuador cria o próprio perfil" on public.perfis;
create policy "tatuador cria o próprio perfil"
  on public.perfis for insert to authenticated
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador edita o próprio perfil" on public.perfis;
create policy "tatuador edita o próprio perfil"
  on public.perfis for update to authenticated
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

drop trigger if exists perfis_atualizado_em on public.perfis;
create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

-- ── Orçamentos ────────────────────────────────────────────────────────────────
create table if not exists public.orcamentos (
  -- O id vem pronto do site (as imagens são enviadas antes, já com ele no nome).
  id            uuid primary key default gen_random_uuid(),
  tatuador_id   uuid not null references auth.users (id) on delete cascade,
  nome          text not null check (length(trim(nome)) between 1 and 120),
  telefone      text not null check (length(regexp_replace(telefone, '\D', '', 'g')) between 10 and 13),
  descricao     text not null check (length(trim(descricao)) between 1 and 2000),
  local_corpo   text check (length(local_corpo) <= 120),
  -- Caminhos das imagens de referência no espaço "fotos" (até 5).
  imagens       text[] not null default '{}' check (cardinality(imagens) <= 5),
  -- novo → respondido (tocou no WhatsApp) → arquivado
  status        text not null default 'novo' check (status in ('novo', 'respondido', 'arquivado')),
  -- Cliente cadastrado a partir deste orçamento.
  cliente_id    uuid references public.clientes (id) on delete set null,
  criado_em     timestamptz not null default now()
);

create index if not exists orcamentos_tatuador_criado_idx on public.orcamentos (tatuador_id, criado_em desc);

alter table public.orcamentos enable row level security;

-- Qualquer pessoa envia, mas só para um tatuador que tem página e está aceitando pedidos,
-- e sempre começando como "novo", sem cliente ligado.
drop policy if exists "visitante envia orçamento" on public.orcamentos;
create policy "visitante envia orçamento"
  on public.orcamentos for insert to anon, authenticated
  with check (
    status = 'novo'
    and cliente_id is null
    and exists (select 1 from public.perfis p where p.tatuador_id = orcamentos.tatuador_id and p.aceitando)
  );

drop policy if exists "tatuador vê os próprios orçamentos" on public.orcamentos;
create policy "tatuador vê os próprios orçamentos"
  on public.orcamentos for select to authenticated
  using (tatuador_id = auth.uid());

drop policy if exists "tatuador atualiza os próprios orçamentos" on public.orcamentos;
create policy "tatuador atualiza os próprios orçamentos"
  on public.orcamentos for update to authenticated
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador apaga os próprios orçamentos" on public.orcamentos;
create policy "tatuador apaga os próprios orçamentos"
  on public.orcamentos for delete to authenticated
  using (tatuador_id = auth.uid());

-- ── Imagens (espaço "fotos", criado na 0012) ─────────────────────────────────
-- Referências: "<id do tatuador>/orcamentos/<id do orçamento>-<n>.jpg".
-- Qualquer pessoa envia (não lê, não troca, não apaga) para um tatuador que aceita pedidos.
-- O dono da pasta já lê e apaga pelas regras da 0012.
drop policy if exists "fotos: visitante envia referência" on storage.objects;
create policy "fotos: visitante envia referência"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'fotos'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[2] = 'orcamentos'
    and exists (
      select 1 from public.perfis p
      where p.tatuador_id::text = (storage.foldername(name))[1] and p.aceitando
    )
  );

-- A foto de perfil que está na página pública pode ser vista por qualquer pessoa.
drop policy if exists "fotos: foto da página é pública" on storage.objects;
create policy "fotos: foto da página é pública"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'fotos' and exists (select 1 from public.perfis p where p.foto = name));
