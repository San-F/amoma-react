-- =====================================================================
-- Amoma — almacenamiento de imágenes
--
-- Bucket público: cualquiera puede VER una foto si tiene su URL
-- (es lo que necesita la página). Pero nadie puede LISTAR el bucket,
-- ni subir, reemplazar o borrar, salvo un admin.
-- El tipo y el tamaño se validan en el servidor de Storage, no solo
-- en el navegador.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-images',
  'public-images',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sin política SELECT para anon: las fotos se sirven por URL pública,
-- pero el listado del bucket queda cerrado.

create policy "public-images: admin lee metadatos"
  on storage.objects for select to authenticated
  using (bucket_id = 'public-images' and (select private.is_admin()));

create policy "public-images: admin sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-images' and (select private.is_admin()));

create policy "public-images: admin reemplaza"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-images' and (select private.is_admin()))
  with check (bucket_id = 'public-images' and (select private.is_admin()));

create policy "public-images: admin borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-images' and (select private.is_admin()));
