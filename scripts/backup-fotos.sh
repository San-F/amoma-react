#!/usr/bin/env bash
# Baja a una carpeta las fotos del sitio que todavía no están guardadas.
# Las fotos son públicas: se bajan por su dirección pública, sin ninguna clave.
# Uso: bash scripts/backup-fotos.sh <Project URL> <lista.txt> <carpeta>
set -euo pipefail
URL="${1:?Falta la Project URL}"; LISTA="${2:?Falta la lista de fotos}"; DESTINO="${3:?Falta la carpeta}"
nuevas=0; fallidas=0
while IFS= read -r nombre; do
  [ -n "$nombre" ] || continue
  # nombres seguros: letras, números, guiones, puntos y barras; sin ".."
  if [[ ! "$nombre" =~ ^[A-Za-z0-9._/-]+$ || "$nombre" == *..* || "$nombre" == /* ]]; then
    echo "✗ nombre de foto raro, no se baja: $nombre"; fallidas=$((fallidas + 1)); continue
  fi
  [ -s "$DESTINO/$nombre" ] && continue
  mkdir -p "$(dirname "$DESTINO/$nombre")"
  if curl -fsS -m 60 -o "$DESTINO/$nombre" "$URL/storage/v1/object/public/public-images/$nombre"; then
    nuevas=$((nuevas + 1))
  else
    rm -f "$DESTINO/$nombre"; echo "✗ no se pudo bajar: $nombre"; fallidas=$((fallidas + 1))
  fi
done < "$LISTA"
echo "Fotos nuevas guardadas: $nuevas · con problemas: $fallidas"
[ "$fallidas" -eq 0 ]
