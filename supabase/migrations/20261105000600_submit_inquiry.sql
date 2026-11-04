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
