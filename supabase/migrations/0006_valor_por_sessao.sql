-- O valor passa a ser de cada sessão (não mais da tatuagem), e cada pagamento
-- pertence a uma sessão. Quem cobra pelo projeto põe o valor total na primeira
-- sessão e 0 nas outras. Sessões canceladas ou com falta não entram no "a receber".
-- Pode ser rodado de novo sem problema (se parar no meio, é só rodar outra vez).

alter table public.sessoes
  add column if not exists valor numeric(10, 2) check (valor >= 0);

alter table public.pagamentos
  add column if not exists sessao_id uuid references public.sessoes (id) on delete cascade;

-- Leva o valor já cadastrado na tatuagem e os pagamentos para a primeira sessão dela.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'tatuagens' and column_name = 'valor') then
    with primeira as (
      select distinct on (tatuagem_id) id, tatuagem_id
      from public.sessoes
      order by tatuagem_id, inicio
    )
    update public.sessoes s
    set valor = t.valor
    from primeira p
    join public.tatuagens t on t.id = p.tatuagem_id
    where s.id = p.id and t.valor is not null and s.valor is null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'pagamentos' and column_name = 'tatuagem_id') then
    with primeira as (
      select distinct on (tatuagem_id) id, tatuagem_id
      from public.sessoes
      order by tatuagem_id, inicio
    )
    update public.pagamentos pg
    set sessao_id = p.id
    from primeira p
    where pg.tatuagem_id = p.tatuagem_id and pg.sessao_id is null;
  end if;
end $$;

-- Pagamentos de tatuagens sem nenhuma sessão não têm onde ficar.
delete from public.pagamentos where sessao_id is null;

-- A política antiga usa tatuagem_id; precisa sair antes da coluna.
drop policy if exists "tatuador registra pagamentos das próprias tatuagens" on public.pagamentos;
drop policy if exists "tatuador registra pagamentos das próprias sessões" on public.pagamentos;

alter table public.pagamentos alter column sessao_id set not null;
alter table public.pagamentos drop column if exists tatuagem_id;
alter table public.tatuagens drop column if exists valor;

create index if not exists pagamentos_sessao_idx on public.pagamentos (sessao_id);

create policy "tatuador registra pagamentos das próprias sessões"
  on public.pagamentos for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.sessoes s where s.id = sessao_id and s.tatuador_id = auth.uid())
  );
