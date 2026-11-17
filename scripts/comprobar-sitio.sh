#!/usr/bin/env bash
# Comprueba DESDE AFUERA, como un visitante, el sitio ya publicado: que responde,
# que trae sus cabeceras de seguridad y que el panel no se ofrece a los buscadores.
# No cambia nada. Uso: bash scripts/comprobar-sitio.sh https://www.ejemplo.com [--con-panel]
set -uo pipefail
S="${1:?Falta la dirección del sitio}"; S="${S%/}"; PANEL="${2:-}"
fallas=0; cab="$(mktemp)"; cuerpo="$(mktemp)"; trap 'rm -f "$cab" "$cuerpo"' EXIT
ok()  { echo "✓ $1"; }
mal() { echo "✗ $1"; fallas=$((fallas + 1)); }
pedir() { curl -sS -m 25 -D "$cab" -o "$cuerpo" -w "%{http_code}" "$1" 2>/dev/null || echo 000; }
tiene() { grep -qiE "^$1:.*$2" "$cab"; }

case "$S" in
  https://*) ;;
  http://localhost:*|http://127.0.0.1:*) echo "(dirección local: solo para probar este script)";;
  *) mal "La dirección tiene que empezar con https://"; exit 1;;
esac

r="$(pedir "$S/")"
if [ "$r" = "200" ]; then ok "El sitio responde"; else mal "El sitio no responde bien (respondió $r)"; echo; echo "✗ No se pudo mirar el resto."; exit 1; fi
grep -q '<div id="root">' "$cuerpo" && ok "Es la página del sitio" || mal "La portada no es la página esperada"
if grep -qE '\[(TEXTO|FOTO|LOGO)[]:]|%[A-Z_]+%' "$cuerpo"; then mal "La portada tiene marcadores sin completar"; else ok "Sin marcadores en la portada"; fi

tiene content-security-policy "default-src 'self'"   && ok "Lista de orígenes permitidos (CSP)"        || mal "Falta la lista de orígenes permitidos (Content-Security-Policy)"
tiene content-security-policy "frame-ancestors 'none'" && ok "No se puede incrustar en otro sitio"    || mal "La CSP no impide incrustar el sitio (frame-ancestors)"
if grep -qiE "^content-security-policy:.*script-src[^;]*'unsafe-(inline|eval)'" "$cab"; then mal "La CSP permite código incrustado (unsafe-inline / unsafe-eval)"; else ok "La CSP no permite código incrustado"; fi
tiene strict-transport-security "max-age=[0-9]{8,}"  && ok "Conexión segura forzada (HSTS)"             || mal "Falta forzar la conexión segura (Strict-Transport-Security)"
tiene x-content-type-options "nosniff"               && ok "Tipos de archivo estrictos"                 || mal "Falta X-Content-Type-Options: nosniff"
tiene referrer-policy "."                            && ok "Política de referencia"                     || mal "Falta Referrer-Policy"
tiene permissions-policy "."                         && ok "Permisos del navegador limitados"           || mal "Falta Permissions-Policy"

case "$S" in https://*)
  h="${S#https://}"; r="$(curl -sS -m 25 -o /dev/null -w "%{http_code} %{redirect_url}" "http://$h/" 2>/dev/null || echo 000)"
  case "$r" in 30*" https://"*) ok "http:// redirige a https://";; *) mal "http:// no redirige a https:// (respondió $r)";; esac;;
esac

for f in robots.txt sitemap.xml; do
  r="$(pedir "$S/$f")"
  if [ "$r" = "200" ] && ! grep -qi "<!doctype html" "$cuerpo"; then ok "/$f existe"; else mal "/$f no existe (respondió $r)"; fi
done
pedir "$S/robots.txt" >/dev/null; grep -q "Disallow: /admin" "$cuerpo" && ok "robots.txt deja afuera al panel" || mal "robots.txt no excluye /admin"
dominio="$(echo "$S" | sed -E 's#^https?://##')"
pedir "$S/sitemap.xml" >/dev/null
case "$S" in https://*) grep -q "<loc>https://$dominio/" "$cuerpo" && ok "El mapa del sitio usa esta misma dirección" || mal "sitemap.xml tiene otra dirección: corregir la dirección del sitio";; esac

r="$(pedir "$S/una-pagina-que-no-existe-$RANDOM")"
[ "$r" = "200" ] || [ "$r" = "404" ] && ok "Una dirección inexistente muestra la página propia de 'no encontrado'" || mal "Una dirección inexistente respondió $r"

if [ "$PANEL" = "--con-panel" ]; then
  r="$(pedir "$S/admin")"
  [ "$r" = "200" ] && ok "El panel abre" || mal "El panel no abre (respondió $r)"
  tiene x-robots-tag "noindex" && ok "El panel no se ofrece a los buscadores" || mal "Falta X-Robots-Tag: noindex en /admin"
  tiene cache-control "no-store" && ok "El panel no queda guardado en cachés" || mal "Falta Cache-Control: no-store en /admin"
fi

echo
if [ "$fallas" -eq 0 ]; then echo "✓ El sitio publicado está como corresponde"; else echo "✗ $fallas problema(s) en el sitio publicado"; fi
exit $(( fallas > 0 ))
