-- Financeiro, segunda rodada: taxas da maquininha, comissão do estúdio e despesas.
-- Pode ser rodado de novo sem problema (se parar no meio, é só rodar outra vez).

-- Configurações de cada tatuador (uma linha por conta). Percentuais de 0 a 100.
create table if not exists public.configuracoes (
  tatuador_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  taxa_debito       numeric(5, 2) not null default 0 check (taxa_debito between 0 and 100),
  taxa_credito      numeric(5, 2) not null default 0 check (taxa_credito between 0 and 100),
  taxa_pix          numeric(5, 2) not null default 0 check (taxa_pix between 0 and 100),
  comissao_estudio  numeric(5, 2) not null default 0 check (comissao_estudio between 0 and 100),
  atualizado_em     timestamptz not null default now()
);

alter table public.configuracoes enable row level security;

drop policy if exists "tatuador vê as próprias configurações" on public.configuracoes;
create policy "tatuador vê as próprias configurações"
  on public.configuracoes for select
  using (tatuador_id = auth.uid());

drop policy if exists "tatuador cria as próprias configurações" on public.configuracoes;
create policy "tatuador cria as próprias configurações"
  on public.configuracoes for insert
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador edita as próprias configurações" on public.configuracoes;
create policy "tatuador edita as próprias configurações"
  on public.configuracoes for update
  using (tatuador_id = auth.uid())
  with check (tatuador_id = auth.uid());

-- Taxa cobrada pela maquininha em cada pagamento, em reais. Fica gravada no
-- momento do pagamento, para não mudar o passado se o percentual mudar depois.
alter table public.pagamentos
  add column if not exists taxa numeric(10, 2) not null default 0 check (taxa >= 0);

-- Despesas do tatuador (material, aluguel, divulgação...).
create table if not exists public.despesas (
  id            uuid primary key default gen_random_uuid(),
  tatuador_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao     text not null check (length(trim(descricao)) > 0),
  valor         numeric(10, 2) not null check (valor > 0),
  data          date not null,
  categoria     text not null default 'outros'
                check (categoria in ('material', 'aluguel', 'divulgacao', 'equipamento', 'outros')),
  criado_em     timestamptz not null default now()
);

create index if not exists despesas_tatuador_data_idx on public.despesas (tatuador_id, data);

alter table public.despesas enable row level security;

drop policy if exists "tatuador vê as próprias despesas" on public.despesas;
create policy "tatuador vê as próprias despesas"
  on public.despesas for select
  using (tatuador_id = auth.uid());

drop policy if exists "tatuador registra as próprias despesas" on public.despesas;
create policy "tatuador registra as próprias despesas"
  on public.despesas for insert
  with check (tatuador_id = auth.uid());

drop policy if exists "tatuador exclui as próprias despesas" on public.despesas;
create policy "tatuador exclui as próprias despesas"
  on public.despesas for delete
  using (tatuador_id = auth.uid());
