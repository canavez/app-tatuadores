-- Quem trabalha em estúdio de outra pessoa paga comissão (%); quem tem estúdio
-- próprio paga contas fixas por mês (aluguel, água, luz, internet...).
-- Pode ser rodado de novo sem problema.

alter table public.configuracoes
  add column if not exists modelo text not null default 'comissao'
    check (modelo in ('comissao', 'proprio'));

alter table public.configuracoes
  add column if not exists contas_fixas numeric(10, 2) not null default 0
    check (contas_fixas >= 0);
