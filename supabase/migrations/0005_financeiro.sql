-- Financeiro básico: valor combinado de cada tatuagem e os pagamentos recebidos
-- (sinal e pagamentos das sessões). O que falta receber = valor - soma dos pagamentos.

alter table public.tatuagens
  add column valor numeric(10, 2) check (valor >= 0);

create table public.pagamentos (
  id            uuid primary key default gen_random_uuid(),
  tatuador_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tatuagem_id   uuid not null references public.tatuagens (id) on delete cascade,
  valor         numeric(10, 2) not null check (valor > 0),
  data          date not null,
  tipo          text not null default 'pagamento' check (tipo in ('sinal', 'pagamento')),
  forma         text not null check (forma in ('pix', 'dinheiro', 'debito', 'credito', 'outro')),
  observacoes   text,
  criado_em     timestamptz not null default now()
);

create index pagamentos_tatuagem_idx on public.pagamentos (tatuagem_id);
create index pagamentos_tatuador_data_idx on public.pagamentos (tatuador_id, data);

alter table public.pagamentos enable row level security;

create policy "tatuador vê os próprios pagamentos"
  on public.pagamentos for select
  using (tatuador_id = auth.uid());

create policy "tatuador registra pagamentos das próprias tatuagens"
  on public.pagamentos for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.tatuagens t where t.id = tatuagem_id and t.tatuador_id = auth.uid())
  );

create policy "tatuador exclui os próprios pagamentos"
  on public.pagamentos for delete
  using (tatuador_id = auth.uid());
