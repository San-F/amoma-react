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
