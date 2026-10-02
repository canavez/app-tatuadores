-- Anamnese (ficha de saúde) do cliente: uma por cliente, opcional.
-- Preenchida na edição do cliente; a linha só existe depois do primeiro preenchimento.

create table public.anamneses (
  cliente_id        uuid primary key references public.clientes (id) on delete cascade,
  tatuador_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  diabetes          boolean not null default false,
  hipertensao       boolean not null default false,
  cardiaco          boolean not null default false,
  coagulacao        boolean not null default false,
  epilepsia         boolean not null default false,
  desmaios          boolean not null default false,
  doenca_infecciosa boolean not null default false,
  problema_pele     boolean not null default false,
  queloide          boolean not null default false,
  gestante          boolean not null default false,
  anticoagulante    boolean not null default false,
  isotretinoina     boolean not null default false,
  alergias          text,
  medicamentos      text,
  outras_condicoes  text,
  atualizado_em     timestamptz not null default now()
);

create trigger anamneses_atualizado_em
  before update on public.anamneses
  for each row execute function public.tocar_atualizado_em();

alter table public.anamneses enable row level security;

create policy "tatuador vê as anamneses dos próprios clientes"
  on public.anamneses for select
  using (tatuador_id = auth.uid());

create policy "tatuador preenche anamnese dos próprios clientes"
  on public.anamneses for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.clientes c where c.id = cliente_id and c.tatuador_id = auth.uid())
  );

create policy "tatuador atualiza anamnese dos próprios clientes"
  on public.anamneses for update
  using (tatuador_id = auth.uid())
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.clientes c where c.id = cliente_id and c.tatuador_id = auth.uid())
  );

create policy "tatuador exclui anamnese dos próprios clientes"
  on public.anamneses for delete
  using (tatuador_id = auth.uid());
