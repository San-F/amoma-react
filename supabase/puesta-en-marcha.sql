-- Puesta en marcha de la base: todas las migraciones + datos iniciales.
-- ARCHIVO GENERADO por supabase/armar-puesta-en-marcha.sh (no editar a mano).
-- Pegar TODO en Supabase > SQL Editor y tocar Run. Se ejecuta una sola vez.
-- Si algo falla, no queda nada a medias (todo o nada).
begin;

-- ===== 20261105000100_catalog_schema.sql =====
-- =====================================================================
-- Amoma — esquema del catálogo, roles y auditoría
-- Todo cambio de esquema va en una migración nueva; nunca "a mano".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Esquema privado: funciones auxiliares que NO se exponen por la API.
-- (La Data API de Supabase solo expone el esquema "public".)
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Lista blanca de administradores.
-- Estar logueado NO te hace admin: hay que estar en esta tabla.
-- Se gestiona solo por SQL (sin políticas => nadie la toca por la API).
-- ---------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- security definer: lee "admins" aunque quien pregunta no tenga permiso.
-- search_path vacío: evita que alguien "secuestre" nombres de tablas.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- updated_at automático
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name         text not null check (char_length(name) between 1 and 80),
  description  text check (char_length(description) <= 500),
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references public.categories (id) on delete set null,
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  name              text not null check (char_length(name) between 1 and 120),
  short_description text check (char_length(short_description) <= 200),
  description       text check (char_length(description) <= 3000),
  is_published      boolean not null default false,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);

-- Precios en centavos (entero): nada de float para plata.
create table public.product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  label        text not null check (char_length(label) between 1 and 60),
  servings     integer check (servings > 0 and servings <= 1000),
  price_cents  bigint not null check (price_cents >= 0 and price_cents <= 100000000000),
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) <= 300),
  alt_text     text not null default '' check (char_length(alt_text) <= 200),
  width        integer check (width > 0),
  height       integer check (height > 0),
  is_cover     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id);
-- una sola foto de portada por producto
create unique index product_images_one_cover_idx
  on public.product_images (product_id) where is_cover;

create table public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null check (char_length(storage_path) <= 300),
  alt_text     text not null default '' check (char_length(alt_text) <= 200),
  caption      text check (char_length(caption) <= 200),
  width        integer check (width > 0),
  height       integer check (height > 0),
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Consultas del formulario de contacto (datos personales)
-- El público NO inserta directo: lo hace una Edge Function que valida,
-- verifica anti-bot y limita envíos (Etapa 3).
-- ---------------------------------------------------------------------
create table public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 100),
  email        text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        text check (char_length(phone) <= 30),
  reason       text not null check (reason in ('torta', 'evento', 'consulta')),
  message      text check (char_length(message) <= 2000),
  contact_pref text not null check (contact_pref in ('WhatsApp', 'Instagram', 'Email')),
  status       text not null default 'new' check (status in ('new', 'answered', 'archived')),
  created_at   timestamptz not null default now()
);
create index inquiries_status_created_idx on public.inquiries (status, created_at desc);

-- ---------------------------------------------------------------------
-- Datos del negocio (una sola fila)
-- ---------------------------------------------------------------------
create table public.site_settings (
  id         smallint primary key default 1 check (id = 1),
  whatsapp   text check (whatsapp ~ '^[0-9]{8,15}$'),
  instagram  text check (char_length(instagram) <= 60),
  email      text check (char_length(email) <= 254),
  address    text check (char_length(address) <= 200),
  hours      text check (char_length(hours) <= 300),
  notice     text check (char_length(notice) <= 300),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Auditoría: quién cambió qué y cuándo (solo lectura para admins)
-- ---------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid,
  action     text not null,
  entity     text not null,
  entity_id  text,
  at         timestamptz not null default now()
);
create index audit_log_at_idx on public.audit_log (at desc);

create function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id text;
begin
  if tg_op = 'DELETE' then
    row_id := old.id::text;
  else
    row_id := new.id::text;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id)
  values ((select auth.uid()), lower(tg_op), tg_table_name, row_id);
  return null;
end;
$$;

-- triggers
create trigger categories_touch before update on public.categories
  for each row execute function private.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();
create trigger product_variants_touch before update on public.product_variants
  for each row execute function private.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings
  for each row execute function private.touch_updated_at();

create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function private.write_audit_log();
create trigger products_audit after insert or update or delete on public.products
  for each row execute function private.write_audit_log();
create trigger product_variants_audit after insert or update or delete on public.product_variants
  for each row execute function private.write_audit_log();
create trigger product_images_audit after insert or update or delete on public.product_images
  for each row execute function private.write_audit_log();
create trigger gallery_items_audit after insert or update or delete on public.gallery_items
  for each row execute function private.write_audit_log();
create trigger site_settings_audit after update on public.site_settings
  for each row execute function private.write_audit_log();
create trigger inquiries_audit after update or delete on public.inquiries
  for each row execute function private.write_audit_log();

-- ===== 20261105000200_rls_and_grants.sql =====
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

-- ===== 20261105000300_storage.sql =====
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

-- ===== 20261105000400_admin_mfa.sql =====
-- =====================================================================
-- Amoma — doble factor (MFA) obligatorio para administrar
--
-- Ser admin ahora exige DOS cosas:
--   1) estar en la lista blanca public.admins
--   2) que la sesión actual haya pasado el segundo factor (aal2 = código TOTP)
-- Con solo la contraseña (aal1) un admin puede entrar al panel a
-- configurar/verificar su código, pero la base rechaza cualquier cambio.
-- =====================================================================

create function private.is_admin_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin_member() from public;
grant execute on function private.is_admin_member() to anon, authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin_member()
     and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

-- Para que el panel sepa qué pantalla mostrar. Solo informa sobre la
-- propia sesión; no revela nada de otros usuarios.
create function public.admin_status()
returns table (is_member boolean, has_mfa boolean)
language sql
stable
set search_path = ''
as $$
  select private.is_admin_member(),
         coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

revoke all on function public.admin_status() from public, anon;
grant execute on function public.admin_status() to authenticated;

-- ===== 20261105000500_import_catalog.sql =====
-- =====================================================================
-- Amoma — importación del catálogo desde Excel/CSV
--
-- El panel lee la planilla, la valida y manda un JSON a esta función.
-- Todo se aplica en UNA transacción: o entra todo, o no entra nada.
-- security invoker: corre con los permisos de quien llama, así que las
-- políticas RLS siguen aplicando (solo un admin con MFA puede escribir).
--
-- Formato:
-- { "products": [ {
--     "slug": "lemon-pie", "name": "Lemon pie", "category_slug": "postres",
--     "short_description": "...", "is_published": true,
--     "cover_path": "productos/lemon-pie/abc.webp",          -- opcional
--     "variants": [ { "label": "Chica", "servings": 8, "price_cents": 1800000 } ]
-- } ] }
--
-- Reglas: el producto se identifica por slug (se actualiza si ya existe).
-- Las variantes del producto se REEMPLAZAN por las de la planilla
-- (la planilla es la fuente de verdad de los precios).
-- =====================================================================

create function public.admin_import_catalog(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item       jsonb;
  variant    jsonb;
  cat_id     uuid;
  prod_id    uuid;
  existed    boolean;
  creados    integer := 0;
  actualizados integer := 0;
  variantes  integer := 0;
  orden      integer := 0;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if jsonb_typeof(payload -> 'products') is distinct from 'array' then
    raise exception 'Formato inválido: falta la lista "products"' using errcode = '22023';
  end if;

  if jsonb_array_length(payload -> 'products') > 500 then
    raise exception 'Demasiados productos en una sola importación (máx. 500)' using errcode = '22023';
  end if;

  for item in select * from jsonb_array_elements(payload -> 'products')
  loop
    orden := orden + 1;

    cat_id := null;
    if coalesce(item ->> 'category_slug', '') <> '' then
      select c.id into cat_id from public.categories c where c.slug = item ->> 'category_slug';
      if cat_id is null then
        raise exception 'Fila de "%": la categoría "%" no existe', item ->> 'name', item ->> 'category_slug'
          using errcode = '22023';
      end if;
    end if;

    select exists (select 1 from public.products p where p.slug = item ->> 'slug') into existed;

    insert into public.products (slug, name, category_id, short_description, is_published, sort_order)
    values (
      item ->> 'slug',
      item ->> 'name',
      cat_id,
      nullif(item ->> 'short_description', ''),
      coalesce((item ->> 'is_published')::boolean, false),
      orden
    )
    on conflict (slug) do update
      set name              = excluded.name,
          category_id       = excluded.category_id,
          short_description = coalesce(excluded.short_description, public.products.short_description),
          is_published      = excluded.is_published,
          sort_order        = excluded.sort_order
    returning id into prod_id;

    if existed then actualizados := actualizados + 1; else creados := creados + 1; end if;

    -- precios: la planilla manda
    delete from public.product_variants v where v.product_id = prod_id;
    for variant in select * from jsonb_array_elements(coalesce(item -> 'variants', '[]'::jsonb))
    loop
      insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
      values (
        prod_id,
        variant ->> 'label',
        nullif(variant ->> 'servings', '')::integer,
        (variant ->> 'price_cents')::bigint,
        variantes
      );
      variantes := variantes + 1;
    end loop;

    -- foto de portada (ya subida al Storage por el panel)
    if coalesce(item ->> 'cover_path', '') <> '' then
      update public.product_images i set is_cover = false
        where i.product_id = prod_id and i.is_cover and i.storage_path <> item ->> 'cover_path';
      if exists (
        select 1 from public.product_images i
        where i.product_id = prod_id and i.storage_path = item ->> 'cover_path'
      ) then
        update public.product_images i set is_cover = true
          where i.product_id = prod_id and i.storage_path = item ->> 'cover_path';
      else
        insert into public.product_images (product_id, storage_path, alt_text, is_cover)
        values (prod_id, item ->> 'cover_path', left(item ->> 'name', 200), true);
      end if;
    end if;
  end loop;

  return jsonb_build_object('creados', creados, 'actualizados', actualizados, 'variantes', variantes);
end;
$$;

revoke all on function public.admin_import_catalog(jsonb) from public, anon;
grant execute on function public.admin_import_catalog(jsonb) to authenticated;

-- ===== 20261105000600_submit_inquiry.sql =====
-- =====================================================================
-- Amoma — formulario de contacto: el público envía consultas
--
-- El público NO tiene permiso de INSERT sobre inquiries. Solo puede llamar
-- a esta función, que:
--   1) valida los datos (además de los CHECK de la tabla),
--   2) descarta en silencio a los robots que completan el campo trampa,
--   3) limita envíos: 3 cada 10 min y 10 por día por IP, 200 por día en total,
--   4) guarda la consulta con estado "new" (no se puede elegir otro).
-- La IP no se guarda: solo un hash para contar intentos (privacidad).
-- =====================================================================

-- email pasa a ser opcional (alcanza con email O teléfono)
alter table public.inquiries alter column email drop not null;
alter table public.inquiries
  add constraint inquiries_email_o_telefono
  check (email is not null or phone is not null);

create table private.inquiry_attempts (
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index inquiry_attempts_ip_at_idx on private.inquiry_attempts (ip_hash, at desc);
alter table private.inquiry_attempts enable row level security;
revoke all on private.inquiry_attempts from public, anon, authenticated;

create function public.submit_inquiry(
  p_name         text,
  p_email        text,
  p_phone        text,
  p_reason       text,
  p_message      text,
  p_contact_pref text,
  p_website      text default ''   -- campo trampa: los humanos lo dejan vacío
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  headers json;
  ip      text;
  huella  text;
  email   text := nullif(lower(trim(p_email)), '');
  phone   text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '');
begin
  -- robots: responder "ok" sin guardar nada (no les damos pistas)
  if coalesce(p_website, '') <> '' then
    return true;
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 100 then
    raise exception 'datos_invalidos: nombre' using errcode = '22023';
  end if;
  if email is null and phone is null then
    raise exception 'datos_invalidos: contacto' using errcode = '22023';
  end if;
  if char_length(coalesce(p_message, '')) > 2000 then
    raise exception 'datos_invalidos: mensaje' using errcode = '22023';
  end if;

  -- IP del visitante según las cabeceras que agrega la API (Cloudflare / proxy)
  headers := nullif(current_setting('request.headers', true), '')::json;
  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    'desconocida'
  );
  huella := md5('amoma:' || trim(ip));

  -- limpieza de intentos viejos
  delete from private.inquiry_attempts a where a.at < now() - interval '1 day';

  if (select count(*) from private.inquiry_attempts a
      where a.ip_hash = huella and a.at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.inquiry_attempts a where a.ip_hash = huella) >= 10
     or (select count(*) from private.inquiry_attempts) >= 200 then
    raise exception 'demasiados_envios' using errcode = 'P0001';
  end if;

  insert into private.inquiry_attempts (ip_hash) values (huella);

  insert into public.inquiries (name, email, phone, reason, message, contact_pref)
  values (
    trim(p_name),
    email,
    phone,
    coalesce(nullif(p_reason, ''), 'consulta'),
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(nullif(p_contact_pref, ''), 'WhatsApp')
  );
  return true;
end;
$$;

revoke all on function public.submit_inquiry(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text, text, text, text)
  to anon, authenticated;

-- ===== 20261106000700_product_badge.sql =====
-- =====================================================================
-- Amoma — etiqueta opcional por producto ("Más pedido", "Nuevo",
-- "De temporada"). La elige la dueña desde el panel.
-- =====================================================================
alter table public.products
  add column badge text
  check (badge in ('mas-pedido', 'nuevo', 'temporada'));

-- ===== 20261106000800_image_focus.sql =====
-- =====================================================================
-- Amoma — encuadre de cada foto de producto (lo elige la dueña en el panel,
-- moviendo y acercando la foto dentro del círculo).
--   focus_x / focus_y: punto de la foto que queda centrado (0 a 100 %).
--   zoom: cuánto se acerca (1 = foto entera, hasta 3).
-- Los límites los controla la base, no solo la pantalla.
-- =====================================================================
alter table public.product_images
  add column focus_x numeric(5, 2) not null default 50
    check (focus_x between 0 and 100),
  add column focus_y numeric(5, 2) not null default 50
    check (focus_y between 0 and 100),
  add column zoom numeric(4, 2) not null default 1
    check (zoom between 1 and 3);

-- ===== 20261112000900_categorias_fijas.sql =====
-- =====================================================================
-- Categorías fijas (decisión del 12/11/2026)
-- La portada y los filtros de la página están diseñados para 4 categorías.
-- Desde el panel no se crean, no se borran y no se ocultan: solo se puede
-- cambiar el texto (nombre y descripción). La base lo hace cumplir aunque
-- alguien intente saltearse el panel.
-- =====================================================================

drop policy "categories: admin inserta" on public.categories;
drop policy "categories: admin borra" on public.categories;

revoke insert, update, delete on public.categories from authenticated;
-- solo estas columnas; slug, orden y visibilidad quedan fijos
grant update (name, description) on public.categories to authenticated;

-- ===== 20261113001000_guardar_e_importar.sql =====
-- =====================================================================
-- Amoma — guardar un producto "todo o nada" + importación que no pisa
-- lo que la dueña no tocó (auditoría del 13/11/2026: A3 y A5)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Guardar un producto con sus precios en UNA transacción.
-- Antes el panel hacía 3 pedidos (producto, borrar precios, cargar
-- precios): si se cortaba en el medio, el producto quedaba sin precios.
-- security invoker: las políticas RLS siguen aplicando.
--
-- { "id": "…" (vacío = nuevo), "slug": "lemon-pie", "name": "Lemon pie",
--   "category_id": "…", "short_description": "…", "description": "…",
--   "is_published": true, "is_featured": false, "badge": "nuevo",
--   "variants": [ { "label": "Chica", "servings": 8, "price_cents": 1800000 } ] }
--
-- El slug se fija al crear y NO cambia al renombrar: es el identificador
-- estable (planilla de Excel, pedidos a medio armar de los clientes).
-- =====================================================================
create function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prod_id   uuid := nullif(payload ->> 'id', '')::uuid;
  variantes jsonb := coalesce(payload -> 'variants', '[]'::jsonb);
  variant   jsonb;
  orden     integer := 0;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(variantes) is distinct from 'array' or jsonb_array_length(variantes) > 30 then
    raise exception 'Formato inválido: precios' using errcode = '22023';
  end if;
  if coalesce((payload ->> 'is_published')::boolean, false) and jsonb_array_length(variantes) = 0 then
    raise exception 'Para publicarlo, cargá al menos un precio.' using errcode = '22023';
  end if;

  if prod_id is null then
    insert into public.products
      (slug, name, category_id, short_description, description,
       is_published, is_featured, badge, sort_order)
    values (
      payload ->> 'slug',
      payload ->> 'name',
      nullif(payload ->> 'category_id', '')::uuid,
      nullif(payload ->> 'short_description', ''),
      nullif(payload ->> 'description', ''),
      coalesce((payload ->> 'is_published')::boolean, false),
      coalesce((payload ->> 'is_featured')::boolean, false),
      nullif(payload ->> 'badge', ''),
      (select coalesce(max(p.sort_order), 0) + 1 from public.products p)
    )
    returning id into prod_id;
  else
    update public.products p
       set name              = payload ->> 'name',
           category_id       = nullif(payload ->> 'category_id', '')::uuid,
           short_description = nullif(payload ->> 'short_description', ''),
           description       = nullif(payload ->> 'description', ''),
           is_published      = coalesce((payload ->> 'is_published')::boolean, false),
           is_featured       = coalesce((payload ->> 'is_featured')::boolean, false),
           badge             = nullif(payload ->> 'badge', '')
     where p.id = prod_id;
    if not found then
      raise exception 'El producto ya no existe.' using errcode = '22023';
    end if;
  end if;

  delete from public.product_variants v where v.product_id = prod_id;
  for variant in select * from jsonb_array_elements(variantes)
  loop
    insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
    values (
      prod_id,
      variant ->> 'label',
      nullif(variant ->> 'servings', '')::integer,
      (variant ->> 'price_cents')::bigint,
      orden
    );
    orden := orden + 1;
  end loop;

  return prod_id;
end;
$$;

revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Mostrar/ocultar desde la lista: no se puede mostrar algo sin precio.
-- ---------------------------------------------------------------------
create function private.exigir_precio_al_publicar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and not old.is_published
     and not exists (select 1 from public.product_variants v where v.product_id = new.id) then
    raise exception 'Para publicarlo, cargá al menos un precio.' using errcode = '22023';
  end if;
  return new;
end;
$$;

-- "deferrable initially deferred": se controla al terminar la transacción,
-- así guardar producto + precios juntos (o importar) no choca con la regla.
create constraint trigger products_precio_al_publicar
  after update of is_published on public.products
  deferrable initially deferred
  for each row execute function private.exigir_precio_al_publicar();

-- ---------------------------------------------------------------------
-- Importación desde Excel: mismo formato que antes, con estas reglas:
--   · "is_published" ausente o null  → un producto que ya existe queda como
--     estaba (antes se volvía a mostrar lo oculto); uno nuevo nace visible.
--   · un producto que ya existe NO cambia de lugar; los nuevos van al final.
--   · categoría vacía → el que ya existe conserva la suya.
-- =====================================================================
create or replace function public.admin_import_catalog(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item         jsonb;
  variant      jsonb;
  cat_id       uuid;
  prod_id      uuid;
  creados      integer := 0;
  actualizados integer := 0;
  variantes    integer := 0;
  orden        integer;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if jsonb_typeof(payload -> 'products') is distinct from 'array' then
    raise exception 'Formato inválido: falta la lista "products"' using errcode = '22023';
  end if;

  if jsonb_array_length(payload -> 'products') > 500 then
    raise exception 'Demasiados productos en una sola importación (máx. 500)' using errcode = '22023';
  end if;

  for item in select * from jsonb_array_elements(payload -> 'products')
  loop
    cat_id := null;
    if coalesce(item ->> 'category_slug', '') <> '' then
      select c.id into cat_id from public.categories c where c.slug = item ->> 'category_slug';
      if cat_id is null then
        raise exception 'Fila de "%": la categoría "%" no existe', item ->> 'name', item ->> 'category_slug'
          using errcode = '22023';
      end if;
    end if;

    prod_id := null;
    select p.id into prod_id from public.products p where p.slug = item ->> 'slug';

    if prod_id is null then
      select coalesce(max(p.sort_order), 0) + 1 into orden from public.products p;
      insert into public.products (slug, name, category_id, short_description, is_published, sort_order)
      values (
        item ->> 'slug',
        item ->> 'name',
        cat_id,
        nullif(item ->> 'short_description', ''),
        coalesce((item ->> 'is_published')::boolean, true),
        orden
      )
      returning id into prod_id;
      creados := creados + 1;
    else
      update public.products p
         set name              = item ->> 'name',
             category_id       = coalesce(cat_id, p.category_id),
             short_description = coalesce(nullif(item ->> 'short_description', ''), p.short_description),
             is_published      = coalesce((item ->> 'is_published')::boolean, p.is_published)
       where p.id = prod_id;
      actualizados := actualizados + 1;
    end if;

    -- precios: la planilla manda
    delete from public.product_variants v where v.product_id = prod_id;
    for variant in select * from jsonb_array_elements(coalesce(item -> 'variants', '[]'::jsonb))
    loop
      insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
      values (
        prod_id,
        variant ->> 'label',
        nullif(variant ->> 'servings', '')::integer,
        (variant ->> 'price_cents')::bigint,
        variantes
      );
      variantes := variantes + 1;
    end loop;

    -- foto de portada (opcional; el panel ya la subió al Storage)
    if coalesce(item ->> 'cover_path', '') <> '' then
      update public.product_images i set is_cover = false
        where i.product_id = prod_id and i.is_cover and i.storage_path <> item ->> 'cover_path';
      if exists (
        select 1 from public.product_images i
        where i.product_id = prod_id and i.storage_path = item ->> 'cover_path'
      ) then
        update public.product_images i set is_cover = true
          where i.product_id = prod_id and i.storage_path = item ->> 'cover_path';
      else
        insert into public.product_images (product_id, storage_path, alt_text, is_cover)
        values (prod_id, item ->> 'cover_path', left(item ->> 'name', 200), true);
      end if;
    end if;
  end loop;

  return jsonb_build_object('creados', creados, 'actualizados', actualizados, 'variantes', variantes);
end;
$$;

-- ===== seed.sql =====
-- Datos iniciales (tomados de la página actual). Sin precios: los carga
-- la dueña desde el panel; no inventamos precios.

insert into public.site_settings (id, whatsapp, instagram, address)
values (1, '5491136362466', 'amoma.cakeshop', 'Villa Pueyrredón, CABA')
on conflict (id) do nothing;

insert into public.categories (slug, name, description, sort_order, is_published)
values
  ('tortas', 'Tortas', 'Clásicas y caseras, con ingredientes de primera.', 1, true),
  ('postres', 'Tartas y postres', 'Tartas, porciones y cajitas para regalar.', 2, true),
  ('salado', 'Salado', 'Chipá, tartas y bocaditos para la previa.', 3, true),
  ('personalizadas', 'Tortas personalizadas',
   'Para cumpleaños, casamientos y eventos.', 4, true)
on conflict (slug) do nothing;

commit;
