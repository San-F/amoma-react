#!/usr/bin/env bash
# Abre (o actualiza) un aviso en GitHub → Issues con el informe del control de
# salud. GitHub le manda el mail a quien sigue el repo. Lo usa
# .github/workflows/control-de-salud.yml; necesita GH_TOKEN con permiso "issues".
set -euo pipefail
informe="${1:?Falta el archivo del informe}"
titulo="Control de salud: hay algo para revisar"
cuerpo="$(
  echo "El control automático encontró un problema el $(date -u +%d/%m/%Y)."
  echo
  echo '```'
  tail -n 60 "$informe" 2>/dev/null || echo "(sin informe)"
  echo '```'
  echo
  echo "Detalle: ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID:-}"
  echo
  echo "Qué hacer con cada punto: docs/SI-LLEGA-UN-AVISO.md"
)"
abierto="$(gh issue list --repo "$GITHUB_REPOSITORY" --state open --search "\"$titulo\" in:title" --json number --jq '.[0].number // empty')"
if [ -n "$abierto" ]; then
  gh issue comment "$abierto" --repo "$GITHUB_REPOSITORY" --body "$cuerpo"
else
  gh issue create --repo "$GITHUB_REPOSITORY" --title "$titulo" --body "$cuerpo"
fi
