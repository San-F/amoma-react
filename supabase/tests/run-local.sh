#!/usr/bin/env bash
# Corre las migraciones + tests de permisos contra un Postgres local descartable.
# Uso: PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="amoma_test_$$"
psql -q -v ON_ERROR_STOP=1 -d postgres -c "create database $DB" >/dev/null
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null; for r in anon authenticated service_role; do psql -q -d postgres -c "drop role if exists $r" >/dev/null 2>&1 || true; done' EXIT
run() { psql -q -X -t -v ON_ERROR_STOP=1 -d "$DB" "$@" 2>&1 | sed -n "s/.*NOTICE:  //p; /ERROR/p; /TODOS/p; /^migración/p"; return ${PIPESTATUS[0]}; }
run -f tests/00_supabase_stub.sql
for f in migrations/*.sql; do echo "migración: $f"; run -f "$f"; done
echo "seed: seed.sql (en una base aparte se prueba que aplica)"
run -c "begin;" -f seed.sql -c "rollback;" >/dev/null
run -f tests/rls.test.sql
# el archivo "todo en uno" para pegar en Supabase tiene que estar al día
bash armar-puesta-en-marcha.sh /tmp/puesta-en-marcha.$$.sql
diff -q /tmp/puesta-en-marcha.$$.sql puesta-en-marcha.sql >/dev/null || { echo "ERROR: supabase/puesta-en-marcha.sql está desactualizado. Correr: bash supabase/armar-puesta-en-marcha.sh"; rm -f /tmp/puesta-en-marcha.$$.sql; exit 1; }
rm -f /tmp/puesta-en-marcha.$$.sql
