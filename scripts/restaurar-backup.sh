#!/usr/bin/env bash
# Restaura un backup en una base NUEVA (o de prueba). Paso a paso y con
# explicación: supabase/README.md, "Backup y restauración"
#
# Antes: en la base nueva tienen que estar las tablas (supabase/migrations),
# SIN los datos iniciales (el backup trae los del cliente).
#
#   1) datos:  bash scripts/restaurar-backup.sh datos <backup.sql o backup.sql.gpg> "<cadena de conexión>"
#   2) fotos:  SUPABASE_SECRET_KEY=… bash scripts/restaurar-backup.sh fotos <carpeta fotos> <Project URL nueva>
#
# La clave secreta se pasa SOLO por variable de entorno, en la compu de quien
# restaura: nunca se escribe en un archivo, en el repo ni en un chat.
set -euo pipefail
modo="${1:-}"
case "$modo" in
datos)
  ARCHIVO="${2:?Falta el archivo del backup}"; DB="${3:?Falta la cadena de conexión}"
  sql="$ARCHIVO"; tmp=""
  if [[ "$ARCHIVO" == *.gpg ]]; then
    tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
    gpg --quiet --decrypt --output "$tmp" --yes "$ARCHIVO"   # pide la frase del backup
    sql="$tmp"
  fi
  hay="$(psql "$DB" -At -v ON_ERROR_STOP=1 -c "select (select count(*) from public.products) + (select count(*) from public.categories) + (select count(*) from public.site_settings)")"
  if [ "$hay" != "0" ]; then
    echo "✗ La base de destino ya tiene datos ($hay filas). Se restaura solo sobre una base vacía, para no pisar nada."; exit 1
  fi
  # todo o nada: si una fila falla, no queda nada a medias
  psql "$DB" -q -v ON_ERROR_STOP=1 --single-transaction -f "$sql" >/dev/null
  # el registro de cambios que generó la restauración no es del cliente
  psql "$DB" -At -v ON_ERROR_STOP=1 -c "select 'Restaurado: ' || (select count(*) from public.products) || ' productos, ' || (select count(*) from public.product_variants) || ' precios, ' || (select count(*) from public.product_images) || ' fotos de producto, ' || (select count(*) from public.gallery_items) || ' de galería, ' || (select count(*) from public.inquiries) || ' consultas'"
  echo "Falta: subir las fotos (modo fotos) y dar de alta al administrador (supabase/README.md, punto 3: La dueña)."
  ;;
fotos)
  CARPETA="${2:?Falta la carpeta de fotos}"; URL="${3:?Falta la Project URL}"
  : "${SUPABASE_SECRET_KEY:?Falta SUPABASE_SECRET_KEY (solo como variable de entorno)}"
  n=0; mal=0
  while IFS= read -r -d '' f; do
    nombre="${f#"$CARPETA"/}"
    case "$nombre" in *.webp) tipo=image/webp;; *.png) tipo=image/png;; *.avif) tipo=image/avif;; *) tipo=image/jpeg;; esac
    if curl -fsS -m 120 -o /dev/null -X POST "$URL/storage/v1/object/public-images/$nombre" \
        -H "apikey: $SUPABASE_SECRET_KEY" -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
        -H "Content-Type: $tipo" -H "x-upsert: true" --data-binary "@$f"; then n=$((n + 1))
    else echo "✗ no se pudo subir: $nombre"; mal=$((mal + 1)); fi
  done < <(find "$CARPETA" -type f -print0)
  echo "Fotos subidas: $n · con problemas: $mal"
  [ "$mal" -eq 0 ]
  ;;
*) sed -n '2,13p' "$0"; exit 2 ;;
esac
