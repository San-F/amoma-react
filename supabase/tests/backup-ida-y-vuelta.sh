#!/usr/bin/env bash
# Prueba que un backup SIRVE: carga datos en una base, saca el backup con el
# mismo script que usa la tarea automática, lo restaura en otra base vacía con
# el script de restauración y compara fila por fila.
# Uso: PGHOST=… PGPORT=… PGUSER=postgres bash supabase/tests/backup-ida-y-vuelta.sh
set -euo pipefail
cd "$(dirname "$0")/.."
A="amoma_backup_a_$$"; B="amoma_backup_b_$$"; TMP="$(mktemp -d)"
limpiar() {
  psql -q -d postgres -c "drop database if exists $A" -c "drop database if exists $B" >/dev/null
  for r in anon authenticated service_role; do psql -q -d postgres -c "drop role if exists $r" >/dev/null 2>&1 || true; done
  rm -rf "$TMP"
}
trap limpiar EXIT
crear() {
  psql -q -v ON_ERROR_STOP=1 -d postgres -c "create database $1" >/dev/null
  # los roles son de todo el servidor: el segundo intento los encuentra creados
  sed -E 's/^create role (\w+)/do $r$ begin create role \1/; t fin; b; :fin; s/;$/; exception when duplicate_object then null; end $r$;/' tests/00_supabase_stub.sql \
    | psql -q -X -v ON_ERROR_STOP=1 -d "$1" >/dev/null 2>&1
  for f in migrations/*.sql; do psql -q -X -v ON_ERROR_STOP=1 -d "$1" -f "$f" >/dev/null 2>&1; done
}
TABLAS="site_settings categories products product_variants product_images gallery_items inquiries"
huella() { for t in $TABLAS; do echo "$t $(psql -At -d "$1" -c "select count(*) || ' ' || coalesce(md5(string_agg(x::text, '|' order by x::text)), '-') from public.$t x")"; done; }

crear "$A"
psql -q -X -v ON_ERROR_STOP=1 -d "$A" -f seed.sql >/dev/null
psql -q -X -v ON_ERROR_STOP=1 -d "$A" >/dev/null <<'SQL'
insert into public.products (slug, name, category_id, short_description, is_published)
  select 'producto-' || n, 'Producto ' || n || ' con ''comillas'' y ñ', (select id from public.categories order by sort_order limit 1), E'Línea 1\nLínea 2', n % 2 = 0
  from generate_series(1, 5) n;
insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
  select p.id, v.label, v.servings, v.precio, v.orden from public.products p,
  (values ('Chico', 8, 1800000, 1), ('Grande', null, 3200050, 2)) v(label, servings, precio, orden);
insert into public.product_images (product_id, storage_path, alt_text, width, height, is_cover, focus_x, focus_y, zoom)
  select id, 'productos/' || slug || '/a.webp', 'Foto', 800, 800, true, 40, 60, 1.5 from public.products;
insert into public.gallery_items (storage_path, alt_text, width, height, sort_order, is_published)
  values ('galeria/uno.webp', 'Uno', 800, 600, 1, true), ('galeria/dos.webp', 'Dos', 800, 600, 2, false);
insert into public.inquiries (name, email, phone, reason, message, contact_pref)
  values ('Ana', 'ana@test.com', '+5491155551234', 'torta', E'Hola;\n-- no es un comentario', 'WhatsApp');
update public.site_settings set notice = 'Aviso con "comillas"';
SQL

bash ../scripts/backup-datos.sh "dbname=$A" > "$TMP/backup.sql"
test -s "$TMP/backup.sql"
if grep -qE "COPY public\.(admins|audit_log)" "$TMP/backup.sql"; then echo "ERROR: el backup incluye tablas que no tiene que incluir"; exit 1; fi

crear "$B"
bash ../scripts/restaurar-backup.sh datos "$TMP/backup.sql" "dbname=$B" | sed 's/^/   /'
if ! diff <(huella "$A") <(huella "$B"); then echo "ERROR: lo restaurado NO es igual a lo guardado"; exit 1; fi
echo "ok  backup: lo restaurado es idéntico, tabla por tabla"

# el código de número sigue donde iba (un producto nuevo no repite un código viejo)
nuevo="$(psql -q -At -d "$B" -c "insert into public.products (slug, name) values ('despues', 'Después') returning code")"
max="$(psql -At -d "$A" -c "select max(code) from public.products")"
if [ "$nuevo" -le "$max" ]; then echo "ERROR: el código de producto se repite después de restaurar ($nuevo ≤ $max)"; exit 1; fi
echo "ok  backup: los códigos de producto siguen la numeración ($max → $nuevo)"

# restaurar dos veces (o sobre una base con datos) se rechaza: no pisa nada
# (tiene que frenarlo el control del script, ANTES de tocar la base: si lo frena
# un error de la base por datos repetidos, alguna fila ya se intentó escribir)
if bash ../scripts/restaurar-backup.sh datos "$TMP/backup.sql" "dbname=$B" > "$TMP/segunda.txt" 2>&1; then echo "ERROR: dejó restaurar sobre una base con datos"; exit 1; fi
if ! grep -q "ya tiene datos" "$TMP/segunda.txt"; then echo "ERROR: dejó restaurar sobre una base con datos (no la frenó el control previo: $(head -c 200 "$TMP/segunda.txt"))"; exit 1; fi
echo "ok  backup: restaurar sobre una base con datos se rechaza"
echo "BACKUP Y RESTAURACIÓN: TODO BIEN"
