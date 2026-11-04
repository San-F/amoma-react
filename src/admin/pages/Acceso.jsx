// Llega desde el email de invitación o de "olvidé mi contraseña":
// /admin/acceso?token_hash=...&type=invite|recovery
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { mensajeError } from "../auth";

const MINIMO = 15; // NIST SP 800-63B-4: largo > complejidad

function Acceso() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [fase, setFase] = useState("verificando"); // verificando | clave | error
  const [error, setError] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [guardando, setGuardando] = useState(false);
  const usado = useRef(false); // el token sirve una sola vez

  useEffect(() => {
    if (usado.current) return;
    usado.current = true;
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    if (!token_hash || !["invite", "recovery"].includes(type)) {
      setFase("error");
      setError("El link no es válido.");
      return;
    }
    // sacar el token de la barra de direcciones (no queda en historial)
    window.history.replaceState(null, "", "/admin/acceso");
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        setFase("error");
        setError(mensajeError(error));
      } else setFase("clave");
    });
  }, [params]);

  const problema =
    p1.length < MINIMO
      ? `Mínimo ${MINIMO} caracteres. Tip: usá una frase, ej. "torta de limón los domingos".`
      : p1 !== p2
        ? "Las contraseñas no coinciden."
        : "";

  const guardar = async (e) => {
    e.preventDefault();
    if (problema) return;
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setGuardando(false);
    if (error) setError(mensajeError(error));
    else navigate("/admin/seguridad", { replace: true });
  };

  return (
    <div className="adm-auth">
      <div className="adm-auth__caja">
        <p className="adm-auth__marca">Amoma · Panel</p>
        {fase === "verificando" && <p>Verificando el link…</p>}
        {fase === "error" && (
          <>
            <h1>No pudimos abrir el link</h1>
            <p className="adm-error">{error}</p>
            <a className="btn" href="/admin/ingresar">
              Ir a ingresar
            </a>
          </>
        )}
        {fase === "clave" && (
          <form onSubmit={guardar} className="adm-auth__form">
            <h1>Creá tu contraseña</h1>
            <div className="campo">
              <label htmlFor="p1">Contraseña nueva</label>
              <input
                id="p1"
                type="password"
                autoComplete="new-password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="p2">Repetila</label>
              <input
                id="p2"
                type="password"
                autoComplete="new-password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
              />
            </div>
            {(p1 || p2) && problema && <p className="adm-ayuda">{problema}</p>}
            {error && (
              <p className="adm-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn" disabled={Boolean(problema) || guardando}>
              {guardando ? "Guardando…" : "Guardar y seguir"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Acceso;
