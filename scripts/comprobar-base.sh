#!/usr/bin/env bash
# Comprueba DESDE AFUERA, como un visitante cualquiera, que la base de un cliente
# quedó bien cerrada. Se corre al terminar el alta de Supabase y en cada revisión.
# Solo usa los dos datos PÚBLICOS del proyecto. No cambia nada (lo que intenta
# escribir tiene que ser rechazado).
# Uso: bash scripts/comprobar-base.sh https://xxxx.supabase.co sb_publishable_xxxx
set -uo pipefail
U="${1:?Falta la Project URL}"; K="${2:?Falta la publishable key}"
case "$K" in sb_secret_*|*service_role*) echo "✗ Esa es una clave SECRETA: no se usa acá. Cambiala en Supabase, porque quedó expuesta."; exit 2;; esac
fallas=0; cuerpo="$(mktemp)"; trap 'rm -f "$cuerpo"' EXIT
pedir() { curl -sS -m 25 -o "$cuerpo" -w "%{http_code}" "$@" -H "apikey: $K" 2>/dev/null || echo 000; }
ok()   { echo "✓ $1"; }
mal()  { echo "✗ $1"; fallas=$((fallas + 1)); }
# espera(descripción, códigos aceptados separados por |, argumentos de curl…)
espera() { local d="$1" c="$2"; shift 2; local r; r="$(pedir "$@")"
  if [[ "|$c|" == *"|$r|"* ]]; then ok "$d"; else mal "$d (respondió $r: $(head -c 120 "$cuerpo"))"; fi; }
vacio() { local d="$1"; shift; local r; r="$(pedir "$@")"
  if [[ "$r" == "200" && "$(tr -d ' \n' < "$cuerpo")" == "[]" ]] || [[ "$r" == 4* ]]; then ok "$d"; else mal "$d (respondió $r: $(head -c 120 "$cuerpo"))"; fi; }
J=(-H "Content-Type: application/json")

echo "— Lo que el público SÍ tiene que poder —"
espera "Lee las categorías publicadas"            "200" "$U/rest/v1/categories?select=slug"
espera "Lee los datos del negocio"                "200" "$U/rest/v1/site_settings?select=whatsapp"

echo "— Lo que el público NO tiene que poder —"
espera "No lee las consultas de clientes"         "401|403" "$U/rest/v1/inquiries?select=*"
espera "No lee la lista de administradores"       "401|403" "$U/rest/v1/admins?select=*"
espera "No lee el registro de cambios"            "401|403" "$U/rest/v1/audit_log?select=*"
espera "No crea categorías"                       "401|403" -X POST  "$U/rest/v1/categories" "${J[@]}" -d '{"slug":"prueba-de-permisos","name":"x"}'
espera "No cambia los datos del negocio"          "401|403" -X PATCH "$U/rest/v1/site_settings?id=eq.1" "${J[@]}" -d '{"whatsapp":"5490000000000"}'
espera "No cambia precios"                        "401|403" -X PATCH "$U/rest/v1/product_variants?id=not.is.null" "${J[@]}" -d '{"price_cents":1}'
espera "No borra productos"                       "401|403" -X DELETE "$U/rest/v1/products?id=not.is.null"
espera "No se agrega como administrador"          "401|403" -X POST  "$U/rest/v1/admins" "${J[@]}" -d '{"user_id":"00000000-0000-0000-0000-000000000001"}'
vacio  "No puede listar las fotos"                -X POST "$U/storage/v1/object/list/public-images" "${J[@]}" -d '{"prefix":"","limit":10}'
r="$(printf '\x89PNG\r\n\x1a\n' | pedir -X POST "$U/storage/v1/object/public-images/prueba-de-permisos.png" -H "Content-Type: image/png" --data-binary @-)"
if grep -qi "row-level security\|Unauthorized\|AccessDenied" "$cuerpo"; then ok "No sube imágenes"; else mal "No sube imágenes (respondió $r: $(head -c 120 "$cuerpo"))"; fi

echo "— Login —"
r="$(pedir "$U/auth/v1/settings")"
if grep -q '"disable_signup":true' "$cuerpo"; then ok "Registro público apagado"; else mal "El registro público está ABIERTO (Authentication → Sign In / Providers → Allow new users to sign up)"; fi
if grep -q '"anonymous_users":false' "$cuerpo"; then ok "Ingreso anónimo apagado"; else mal "El ingreso anónimo está activo"; fi
if grep -q '"mailer_autoconfirm":false' "$cuerpo"; then ok "Confirmación de mail activa"; else mal "La confirmación de mail está apagada"; fi
r="$(pedir -X POST "$U/auth/v1/signup" "${J[@]}" -d "{\"email\":\"prueba-$RANDOM@example.com\",\"password\":\"una-clave-larga-de-prueba-123\"}")"
if grep -q "signup_disabled" "$cuerpo"; then ok "Intentar registrarse es rechazado"; else mal "Se pudo intentar un registro (respondió $r: $(head -c 120 "$cuerpo"))"; fi

echo
if [[ $fallas -eq 0 ]]; then echo "✓ La base está cerrada como corresponde"; else echo "✗ $fallas problema(s): no entregar hasta resolverlos"; fi
exit $(( fallas > 0 ))
