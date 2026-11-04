-- =====================================================================
-- Amoma — permisos: Row Level Security + privilegios explícitos
--
-- Principio: nada abierto por defecto. Primero se quita todo y después
-- se otorga solo lo necesario. RLS decide QUÉ FILAS; los GRANT deciden
-- QUÉ OPERACIONES puede intentar cada rol.
--
-- Roles de Supabase:
--   anon          → visitante sin login (usa la publishable key)
--   authenticated → cualquiera con sesión iniciada (NO implica admin)
--   service_role  → servidor (secret key); saltea RLS. Solo Edge Functions.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) RLS activado en TODAS las tablas
-- ---------------------------------------------------------------------
alter table public.admins           enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.gallery_items    enable row level security;
alter table public.inquiries        enable row level security;
alter table public.site_settings    enable row level security;
alter table public.audit_log        enable row level security;

-- ---------------------------------------------------------------------
-- 2) Privilegios: quitar todo y otorgar lo mínimo
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tablas nuevas futuras: cerradas por defecto (aunque el proyecto tenga
-- activado "exponer automáticamente nuevas tablas").
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- Lectura pública del catálogo (RLS filtra lo no publicado)
grant select on public.categories, public.products, public.product_variants,
  public.product_images, public.gallery_items, public.site_settings
  to anon, authenticated;

-- Escritura del catálogo: solo usuarios con sesión (RLS exige admin)
grant insert, update, delete on public.categories, public.products,
  public.product_variants, public.product_images, public.gallery_items
  to authenticated;
grant update on public.site_settings to authenticated;

-- Consultas: solo admins leen/gestionan. Nadie inserta por la API.
grant select, update, delete on public.inquiries to authenticated;

-- Auditoría: solo lectura (RLS exige admin). Escribe el trigger.
grant select on public.audit_log to authenticated;

-- admins: sin privilegios para anon/authenticated (solo SQL / service_role)

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------
-- 3) Políticas
-- (select private.is_admin()) entre paréntesis: Postgres lo evalúa una
-- vez por consulta y no una vez por fila (recomendación de Supabase).
-- ---------------------------------------------------------------------

-- categories
create policy "categories: público lee publicadas"
  on public.categories for select to anon, authenticated
  using (is_published or (select private.is_admin()));

create policy "categories: admin inserta"
  on public.categories for insert to authenticated
  with check ((select private.is_admin()));

create policy "categories: admin actualiza"
  on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "categories: admin borra"
  on public.categories for delete to authenticated
  using ((select private.is_admin()));

-- products: visible si está publicado y su categoría también (o no tiene)
create policy "products: público lee publicados"
  on public.products for select to anon, authenticated
  using (
    (select private.is_admin())
    or (
      is_published
      and (
        category_id is null
        or exists (
          select 1 from public.categories c
          where c.id = category_id and c.is_published
        )
      )
    )
  );

create policy "products: admin inserta"
  on public.products for insert to authenticated
  with check ((select private.is_admin()));

create policy "products: admin actualiza"
  on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "products: admin borra"
  on public.products for delete to authenticated
  using ((select private.is_admin()));

-- product_variants: visibles si el producto es visible
-- (el EXISTS sobre products ya aplica la política de products)
create policy "variants: público lee las de productos visibles"
  on public.product_variants for select to anon, authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.products p where p.id = product_id)
  );

create policy "variants: admin inserta"
  on public.product_variants for insert to authenticated
  with check ((select private.is_admin()));

create policy "variants: admin actualiza"
  on public.product_variants for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "variants: admin borra"
  on public.product_variants for delete to authenticated
  using ((select private.is_admin()));

-- product_images: igual que variantes
create policy "images: público lee las de productos visibles"
  on public.product_images for select to anon, authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.products p where p.id = product_id)
  );

create policy "images: admin inserta"
  on public.product_images for insert to authenticated
  with check ((select private.is_admin()));

create policy "images: admin actualiza"
  on public.product_images for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "images: admin borra"
  on public.product_images for delete to authenticated
  using ((select private.is_admin()));

-- gallery_items
create policy "gallery: público lee publicadas"
  on public.gallery_items for select to anon, authenticated
  using (is_published or (select private.is_admin()));

create policy "gallery: admin inserta"
  on public.gallery_items for insert to authenticated
  with check ((select private.is_admin()));

create policy "gallery: admin actualiza"
  on public.gallery_items for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "gallery: admin borra"
  on public.gallery_items for delete to authenticated
  using ((select private.is_admin()));

-- site_settings
create policy "settings: público lee"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "settings: admin actualiza"
  on public.site_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- inquiries: solo admin
create policy "inquiries: admin lee"
  on public.inquiries for select to authenticated
  using ((select private.is_admin()));

create policy "inquiries: admin actualiza"
  on public.inquiries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "inquiries: admin borra"
  on public.inquiries for delete to authenticated
  using ((select private.is_admin()));

-- audit_log: solo admin lee
create policy "audit: admin lee"
  on public.audit_log for select to authenticated
  using ((select private.is_admin()));

-- admins: sin políticas => nadie accede por la API.
