// Verificación anti-robots de Cloudflare (gratis). Si no hay site key
// configurada, no se muestra y el login funciona sin captcha.
import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const turnstileActivo = Boolean(SITE_KEY);

let carga;
function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  carga ??= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = ok;
    s.onerror = () => mal(new Error("No se pudo cargar la verificación"));
    document.head.appendChild(s);
  });
  return carga;
}

function Turnstile({ onToken }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let id;
    let vivo = true;
    cargarScript().then(() => {
      if (!vivo || !ref.current) return;
      id = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        language: "es",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    });
    return () => {
      vivo = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="turnstile" />;
}

export default Turnstile;
