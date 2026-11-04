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
