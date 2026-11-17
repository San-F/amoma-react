#!/usr/bin/env bash
# Saca por la salida estándar los DATOS que cargó el cliente (no la estructura:
# esa está en supabase/migrations). Lo usa el backup automático.
# No incluye: la lista de administradores ni el registro de cambios (dependen
# de los usuarios, que no se copian: en una base nueva se dan de alta otra vez).
# Uso: bash scripts/backup-datos.sh "<cadena de conexión>" > backup.sql
set -euo pipefail
DB="${1:?Falta la cadena de conexión}"
TABLAS=(site_settings categories products product_variants product_images gallery_items inquiries)
args=()
for t in "${TABLAS[@]}"; do args+=(--table="public.$t"); done
pg_dump "$DB" --data-only --no-owner --no-privileges "${args[@]}"
