#!/usr/bin/env bash
# Control de salud: lo corre .github/workflows/control-de-salud.yml una vez
# por mes (y a mano cuando se quiera). Junta todos los controles "desde afuera"
# y dice claro qué miró y qué NO pudo mirar.
# Variables: SITIO_URL (obligatoria) · SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY
# (si hay panel) · BACKUPS_ENABLED=true (si hay backup) · FORZAR_FALLA=true (prueba)
set -uo pipefail
cd "$(dirname "$0")/.."
fallas=0
titulo() { echo; echo "══ $1 ══"; }
correr() { if "$@"; then :; else fallas=$((fallas + 1)); fi; }

titulo "1. Sitio publicado: ${SITIO_URL:-(sin dirección)}"
if [ -z "${SITIO_URL:-}" ]; then echo "✗ Falta la variable SITIO_URL: no se pudo mirar el sitio"; fallas=$((fallas + 1))
else correr bash scripts/comprobar-sitio.sh "$SITIO_URL" ${SUPABASE_URL:+--con-panel}; fi

titulo "2. Base de datos"
if [ -z "${SUPABASE_URL:-}" ]; then echo "– Este sitio no tiene base (sin panel): no aplica"
else correr bash scripts/comprobar-base.sh "$SUPABASE_URL" "${SUPABASE_PUBLISHABLE_KEY:-}"; fi

titulo "3. Backup"
if [ "${BACKUPS_ENABLED:-}" != "true" ]; then
  if [ -n "${SUPABASE_URL:-}" ]; then echo "✗ Hay base pero el backup automático está apagado (variable BACKUPS_ENABLED)"; fallas=$((fallas + 1))
  else echo "– Sin base: no aplica"; fi
else
  ultimo="$(gh api "repos/${GITHUB_REPOSITORY}/commits?sha=backups&per_page=1" --jq '.[0].commit.committer.date' 2>/dev/null || true)"
  if [ -z "$ultimo" ]; then echo "✗ No se encontró ningún backup (no existe la rama backups o no se pudo leer)"; fallas=$((fallas + 1))
  else
    dias=$(( ( $(date -u +%s) - $(date -u -d "$ultimo" +%s) ) / 86400 ))
    if [ "$dias" -le 10 ]; then echo "✓ Último backup: hace $dias día(s)"; else echo "✗ El último backup tiene $dias días (tendría que ser semanal)"; fallas=$((fallas + 1)); fi
  fi
fi

titulo "4. Paquetes"
if npm audit --audit-level=high --omit=dev >/dev/null 2>&1; then echo "✓ Sin vulnerabilidades altas ni críticas en lo que se publica"
else echo "✗ Hay paquetes con vulnerabilidades altas o críticas (ver: npm audit)"; fallas=$((fallas + 1)); fi

if [ "${FORZAR_FALLA:-false}" = "true" ]; then titulo "Prueba"; echo "✗ Falla simulada a propósito, para probar que llega el aviso"; fallas=$((fallas + 1)); fi

echo
if [ "$fallas" -eq 0 ]; then echo "✓ CONTROL DE SALUD: todo bien"; else echo "✗ CONTROL DE SALUD: $fallas punto(s) para revisar"; fi
exit $(( fallas > 0 ))
