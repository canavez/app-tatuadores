-- Horário de trabalho do tatuador: define a faixa da linha do tempo da agenda
-- e onde aparecem os horários livres. Pode ser rodado de novo sem problema.

alter table public.configuracoes
  add column if not exists hora_inicio time not null default '09:00';

alter table public.configuracoes
  add column if not exists hora_fim time not null default '20:00';
