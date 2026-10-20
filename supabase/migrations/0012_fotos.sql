-- Fotos do tatuador e dos clientes, num espaço de arquivos privado do Supabase (Storage).
-- Cada arquivo fica numa pasta com o id do tatuador: "<id do tatuador>/clientes/<id>.jpg".
-- Só o dono da pasta lê, envia, troca ou apaga. Pode ser rodado de novo sem problema.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: dono vê" on storage.objects;
create policy "fotos: dono vê"
  on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos: dono envia" on storage.objects;
create policy "fotos: dono envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos: dono troca" on storage.objects;
create policy "fotos: dono troca"
  on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos: dono apaga" on storage.objects;
create policy "fotos: dono apaga"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Caminho da foto do cliente dentro do espaço "fotos" (vazio = sem foto).
alter table public.clientes add column if not exists foto text;
