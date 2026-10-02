-- Termo de consentimento: um por tatuagem, assinado na tela.
-- Guarda o texto exato que foi aceito. Não há política de UPDATE:
-- depois de assinado, o termo não pode ser alterado (só excluído).

create table public.termos (
  id                uuid primary key default gen_random_uuid(),
  tatuador_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tatuagem_id       uuid not null unique references public.tatuagens (id) on delete cascade,
  versao            text not null,
  texto             text not null,
  nome_assinante    text not null check (length(trim(nome_assinante)) > 0),
  cpf_assinante     text,
  responsavel_nome  text,
  responsavel_cpf   text,
  autoriza_imagem   boolean not null default false,
  assinatura        text not null
                    check (assinatura like 'data:image/png;base64,%' and length(assinatura) < 400000),
  assinado_em       timestamptz not null default now()
);

alter table public.termos enable row level security;

create policy "tatuador vê os próprios termos"
  on public.termos for select
  using (tatuador_id = auth.uid());

create policy "tatuador registra termos das próprias tatuagens"
  on public.termos for insert
  with check (
    tatuador_id = auth.uid()
    and exists (select 1 from public.tatuagens t where t.id = tatuagem_id and t.tatuador_id = auth.uid())
  );

create policy "tatuador exclui os próprios termos"
  on public.termos for delete
  using (tatuador_id = auth.uid());
