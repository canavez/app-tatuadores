-- "Excluir minha conta" (exigência da App Store e da LGPD).
-- O tatuador logado apaga o próprio usuário; clientes, sessões, anamneses, termos,
-- financeiro e estoque vão junto (todas as tabelas têm "on delete cascade").
-- As fotos do Storage são apagadas antes, pelo app. Pode ser rodado de novo sem problema.

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado para excluir a conta.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Só quem está logado pode chamar (e a função só apaga a própria conta).
revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
