-- =====================================================================
-- Tests de permisos: intentan hacer lo que NO se debería poder.
-- Se corren con: npm run test:db   (ver supabase/tests/run-local.sh)
-- Cualquier fallo corta la ejecución con un error descriptivo.
-- =====================================================================
\set ON_ERROR_STOP on
\set QUIET on

-- ---------------------------------------------------------------------
-- Utilidades de test
-- ---------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

-- Ejecuta SQL y exige que falle con el SQLSTATE indicado.
create function tests.expect_error(label text, stmt text, expected_state text default '42501')
returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FALLÓ [%]: se esperaba error % pero la operación se permitió', label, expected_state;
exception
  when others then
    if sqlstate = 'P0001' and sqlerrm like 'FALLÓ%' then raise; end if;
    if sqlstate <> expected_state then
      raise exception 'FALLÓ [%]: se esperaba error % y llegó % (%)', label, expected_state, sqlstate, sqlerrm;
    end if;
    raise notice 'ok  %', label;
end $$;

-- Ejecuta un SELECT count(*) y compara.
create function tests.expect_count(label text, stmt text, expected bigint)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt into n;
  if n is distinct from expected then
    raise exception 'FALLÓ [%]: esperado %, obtenido %', label, expected, n;
  end if;
  raise notice 'ok  %', label;
end $$;

-- Ejecuta un INSERT/UPDATE/DELETE y compara filas afectadas.
create function tests.expect_rows(label text, stmt text, expected bigint)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n is distinct from expected then
    raise exception 'FALLÓ [%]: filas afectadas esperadas %, obtenidas %', label, expected, n;
  end if;
  raise notice 'ok  %', label;
end $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------
-- Datos de prueba (como postgres, saltea RLS)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'cualquiera@test.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000a');

insert into public.categories (id, slug, name, is_published) values
  ('10000000-0000-0000-0000-000000000001', 'visible', 'Visible', true),
  ('10000000-0000-0000-0000-000000000002', 'oculta', 'Oculta', false);

insert into public.products (id, category_id, slug, name, is_published) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'publicado', 'Publicado', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'borrador', 'Borrador', false),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'en-cat-oculta', 'En categoría oculta', true);

insert into public.product_variants (product_id, label, price_cents) values
  ('20000000-0000-0000-0000-000000000001', '1 kg', 3200000),
  ('20000000-0000-0000-0000-000000000002', '1 kg', 9900000),
  ('20000000-0000-0000-0000-000000000003', '1 kg', 9900000);

insert into public.gallery_items (storage_path, is_published) values
  ('gallery/a.webp', true), ('gallery/b.webp', false);

insert into public.inquiries (name, email, reason, contact_pref)
values ('Cliente', 'cliente@test.local', 'torta', 'WhatsApp');

insert into public.site_settings (id, whatsapp) values (1, '5491100000000');

-- ---------------------------------------------------------------------
-- Chequeos estructurales
-- ---------------------------------------------------------------------
select tests.expect_count('todas las tablas de public tienen RLS',
  $q$ select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $q$, 0);

select tests.expect_count('anon no tiene INSERT/UPDATE/DELETE en ninguna tabla de public',
  $q$ select count(*) from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public'
        and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE') $q$, 0);

select tests.expect_count('ninguna política de escritura usa USING/WITH CHECK (true)',
  $q$ select count(*) from pg_policies
      where schemaname in ('public','storage') and cmd <> 'SELECT'
        and (qual = 'true' or with_check = 'true') $q$, 0);

select tests.expect_count('private.is_admin no está en el esquema expuesto',
  $q$ select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'is_admin' $q$, 0);

-- Una tabla nueva creada después también nace cerrada
create table public.tabla_futura (id int);
select tests.expect_count('tablas futuras nacen sin permisos para anon/authenticated',
  $q$ select count(*) from information_schema.role_table_grants
      where table_name = 'tabla_futura' and grantee in ('anon','authenticated') $q$, 0);
drop table public.tabla_futura;

-- ---------------------------------------------------------------------
-- VISITANTE ANÓNIMO
-- ---------------------------------------------------------------------
begin;
set local role anon;
select set_config('request.jwt.claims', '', true);

select tests.expect_count('anon ve solo categorías publicadas', 'select count(*) from public.categories', 1);
select tests.expect_count('anon ve solo productos publicados de categorías visibles', 'select count(*) from public.products', 1);
select tests.expect_count('anon ve solo variantes de productos visibles', 'select count(*) from public.product_variants', 1);
select tests.expect_count('anon ve solo galería publicada', 'select count(*) from public.gallery_items', 1);
select tests.expect_count('anon lee los datos del negocio', 'select count(*) from public.site_settings', 1);

select tests.expect_error('anon no lee consultas (datos personales)', 'select * from public.inquiries');
select tests.expect_error('anon no inserta consultas directo', $q$ insert into public.inquiries (name,email,reason,contact_pref) values ('x','x@x.com','torta','WhatsApp') $q$);
select tests.expect_error('anon no lee la lista de admins', 'select * from public.admins');
select tests.expect_error('anon no se agrega como admin', $q$ insert into public.admins values ('00000000-0000-0000-0000-00000000000b') $q$);
select tests.expect_error('anon no lee auditoría', 'select * from public.audit_log');
select tests.expect_error('anon no crea categorías', $q$ insert into public.categories (slug,name) values ('hack','Hack') $q$);
select tests.expect_error('anon no cambia precios', 'update public.product_variants set price_cents = 1');
select tests.expect_error('anon no borra productos', 'delete from public.products');
select tests.expect_error('anon no cambia el WhatsApp', $q$ update public.site_settings set whatsapp = '5490000000000' $q$);
select tests.expect_error('anon no sube imágenes', $q$ insert into storage.objects (bucket_id,name) values ('public-images','x.jpg') $q$);
select tests.expect_count('anon no puede listar el bucket', 'select count(*) from storage.objects', 0);
rollback;

-- ---------------------------------------------------------------------
-- USUARIO LOGUEADO QUE NO ES ADMIN (p. ej. alguien que logró crear cuenta)
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select tests.expect_count('no-admin: is_admin() es falso', 'select count(*) from (select 1 where private.is_admin()) t', 0);
select tests.expect_count('no-admin ve lo mismo que el público (productos)', 'select count(*) from public.products', 1);
select tests.expect_count('no-admin no ve consultas', 'select count(*) from public.inquiries', 0);
select tests.expect_error('no-admin no crea categorías', $q$ insert into public.categories (slug,name) values ('hack','Hack') $q$);
select tests.expect_rows('no-admin no cambia precios', 'update public.product_variants set price_cents = 1', 0);
select tests.expect_rows('no-admin no publica borradores', $q$ update public.products set is_published = true where slug = 'borrador' $q$, 0);
select tests.expect_rows('no-admin no borra productos', 'delete from public.products', 0);
select tests.expect_rows('no-admin no cambia el WhatsApp', $q$ update public.site_settings set whatsapp = '5490000000000' $q$, 0);
select tests.expect_rows('no-admin no borra consultas', 'delete from public.inquiries', 0);
select tests.expect_error('no-admin no se agrega como admin', $q$ insert into public.admins values ('00000000-0000-0000-0000-00000000000b') $q$);
select tests.expect_error('no-admin no lee la lista de admins', 'select * from public.admins');
select tests.expect_error('no-admin no sube imágenes', $q$ insert into storage.objects (bucket_id,name) values ('public-images','x.jpg') $q$);
select tests.expect_count('no-admin no ve auditoría', 'select count(*) from public.audit_log', 0);
rollback;

-- ---------------------------------------------------------------------
-- ADMIN
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal2"}', true);

select tests.expect_count('admin: is_admin() es verdadero', 'select count(*) from (select 1 where private.is_admin()) t', 1);
select tests.expect_count('admin ve todas las categorías', 'select count(*) from public.categories', 2);
select tests.expect_count('admin ve todos los productos (incluye borradores)', 'select count(*) from public.products', 3);
select tests.expect_count('admin ve consultas', 'select count(*) from public.inquiries', 1);
select tests.expect_rows('admin crea categoría', $q$ insert into public.categories (slug,name) values ('nueva','Nueva') $q$, 1);
select tests.expect_rows('admin cambia precio', $q$ update public.product_variants set price_cents = 3500000 where label = '1 kg' $q$, 3);
select tests.expect_rows('admin publica borrador', $q$ update public.products set is_published = true where slug = 'borrador' $q$, 1);
select tests.expect_rows('admin cambia el aviso del negocio', $q$ update public.site_settings set notice = 'Agenda de diciembre completa' $q$, 1);
select tests.expect_rows('admin marca consulta como respondida', $q$ update public.inquiries set status = 'answered' $q$, 1);
select tests.expect_rows('admin sube imagen', $q$ insert into storage.objects (bucket_id,name) values ('public-images','productos/x.webp') $q$, 1);
select tests.expect_error('admin tampoco se gestiona admins por la API', $q$ insert into public.admins values ('00000000-0000-0000-0000-00000000000b') $q$);
select tests.expect_count('auditoría registra los cambios del admin con su id',
  $q$ select count(*) from public.audit_log where actor = '00000000-0000-0000-0000-00000000000a' $q$, 7);
rollback;

-- ---------------------------------------------------------------------
-- ADMIN SIN SEGUNDO FACTOR (robaron su contraseña, pero no su celular)
-- ---------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal1"}', true);

select tests.expect_count('admin sin MFA: admin_status dice miembro sin MFA',
  'select count(*) from public.admin_status() where is_member and not has_mfa', 1);
select tests.expect_count('admin sin MFA no ve borradores', 'select count(*) from public.products', 1);
select tests.expect_count('admin sin MFA no ve consultas', 'select count(*) from public.inquiries', 0);
select tests.expect_rows('admin sin MFA no cambia precios', 'update public.product_variants set price_cents = 1', 0);
select tests.expect_error('admin sin MFA no crea categorías', $q$ insert into public.categories (slug,name) values ('x','X') $q$);
select tests.expect_error('admin sin MFA no sube imágenes', $q$ insert into storage.objects (bucket_id,name) values ('public-images','x.jpg') $q$);
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal2"}', true);
select tests.expect_count('no-admin con MFA sigue sin ser admin',
  'select count(*) from public.admin_status() where is_member', 0);
select tests.expect_rows('no-admin con MFA no cambia precios', 'update public.product_variants set price_cents = 1', 0);
rollback;

begin;
set local role anon;
select tests.expect_error('anon no puede consultar admin_status', 'select * from public.admin_status()');
rollback;

-- ---------------------------------------------------------------------
-- Validaciones de datos (aplican a cualquiera, incluso al servidor)
-- ---------------------------------------------------------------------
begin;
select tests.expect_error('precio negativo rechazado', $q$ insert into public.product_variants (product_id,label,price_cents) values ('20000000-0000-0000-0000-000000000001','x',-1) $q$, '23514');
select tests.expect_error('slug con caracteres raros rechazado', $q$ insert into public.categories (slug,name) values ('<script>','x') $q$, '23514');
select tests.expect_error('email inválido rechazado', $q$ insert into public.inquiries (name,email,reason,contact_pref) values ('x','no-es-email','torta','WhatsApp') $q$, '23514');
select tests.expect_error('dos portadas para un producto rechazado', $q$ insert into public.product_images (product_id,storage_path,is_cover) values ('20000000-0000-0000-0000-000000000001','a',true),('20000000-0000-0000-0000-000000000001','b',true) $q$, '23505');
select tests.expect_error('solo puede haber una fila de ajustes', $q$ insert into public.site_settings (id) values (2) $q$, '23514');
rollback;

\echo 'TODOS LOS TESTS DE PERMISOS PASARON'
