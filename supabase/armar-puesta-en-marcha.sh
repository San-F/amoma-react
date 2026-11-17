#!/usr/bin/env bash
# Arma supabase/puesta-en-marcha.sql: todas las migraciones + datos iniciales en
# UN archivo para pegar en Supabase > SQL Editor (una sola vez, todo o nada).
# No editar ese archivo a mano: se cambia la migración y se vuelve a armar.
# Uso: bash supabase/armar-puesta-en-marcha.sh [--sin-datos] [archivo-de-salida]
#   --sin-datos: solo la estructura (para restaurar un backup encima)
set -euo pipefail
cd "$(dirname "$0")"
DATOS=1
if [ "${1:-}" = "--sin-datos" ]; then
  DATOS=0; shift
  : "${1:?Con --sin-datos hay que decir el archivo de salida (con su ruta completa)}"
fi
SALIDA="${1:-puesta-en-marcha.sql}"
{
  echo "-- Puesta en marcha de la base: todas las migraciones + datos iniciales."
  echo "-- ARCHIVO GENERADO por supabase/armar-puesta-en-marcha.sh (no editar a mano)."
  echo "-- Pegar TODO en Supabase > SQL Editor y tocar Run. Se ejecuta una sola vez."
  echo "-- Si algo falla, no queda nada a medias (todo o nada)."
  echo "begin;"
  for f in migrations/*.sql; do
    echo
    echo "-- ===== $(basename "$f") ====="
    cat "$f"
  done
  if [ "$DATOS" = 1 ]; then
    echo
    echo "-- ===== seed.sql ====="
    cat seed.sql
  fi
  echo
  echo "commit;"
} > "$SALIDA"
