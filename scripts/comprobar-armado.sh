#!/usr/bin/env bash
# Revisa lo que va a recibir el navegador (la carpeta armada): no puede haber
# ninguna clave secreta. Todo lo que está ahí es público.
# Uso: bash scripts/comprobar-armado.sh [carpeta]   (por defecto: dist)
set -uo pipefail
DIR="${1:-dist}"
[ -d "$DIR" ] || { echo "✗ No existe la carpeta $DIR (correr antes: npm run build)"; exit 2; }
fallas=0
buscar() { # descripción, expresión
  local hallado; hallado="$(grep -rIlE -e "$2" "$DIR" 2>/dev/null | head -5)"
  if [ -n "$hallado" ]; then echo "✗ $1 en: $(echo "$hallado" | tr '\n' ' ')"; fallas=$((fallas + 1)); else echo "✓ Sin $1"; fi
}
buscar "clave secreta de Supabase"            'sb_secret_[A-Za-z0-9_-]{8,}'
buscar "clave service_role de Supabase"       '"role":[[:space:]]*"service_role"|c2VydmljZV9yb2xl'
buscar "cadena de conexión a la base"         'postgres(ql)?://[^[:space:]"]+:[^[:space:]"@]+@'
buscar "clave privada"                        'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'
buscar "credencial de Mercado Pago"           '(APP_USR|TEST)-[0-9]{12,}-[0-9]{6}-[a-f0-9]{32}'
buscar "token de GitHub"                      'gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}'
buscar "frase del backup o clave de la base"  'BACKUP_PASSPHRASE|SUPABASE_DB_URL|SUPABASE_SECRET_KEY'
[ "$fallas" -eq 0 ] && echo "✓ Lo que recibe el navegador no trae claves" || echo "✗ $fallas problema(s): NO publicar. Cambiar esa clave en el servicio (quedó expuesta)."
exit $(( fallas > 0 ))
