import { useCallback, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { mensajeError, useAuth } from "../auth";
import Turnstile, { turnstileActivo } from "../Turnstile";

function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const [modo, setModo] = useState("login"); // login | olvido | enviado
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const onToken = useCallback((t) => setCaptcha(t), []);

  if (session)
    return <Navigate to={location.state?.desde ?? "/admin"} replace />;

  const puedeEnviar =
    email && (modo === "olvido" || password) && (!turnstileActivo || captcha);

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError("");
    const options = captcha ? { captchaToken: captcha } : undefined;
    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options,
      });
      if (error) setError(mensajeError(error));
    } else {
      // Siempre el mismo mensaje, exista o no el email (no dar pistas)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/acceso`,
        captchaToken: captcha ?? undefined,
      });
      setModo("enviado");
    }
    setEnviando(false);
  };

  return (
    <main className="adm-auth">
      <form className="adm-auth__caja" onSubmit={enviar}>
        <img className="adm-auth__logo" src="/logo.png" alt="Amoma" />
        {modo === "enviado" ? (
          <>
            <h1>Revisá tu email</h1>
            <p>
              Si el email está registrado, te llega un link para crear una
              contraseña nueva.
            </p>
            <button
              type="button"
              className="btn btn--borde"
              onClick={() => setModo("login")}
            >
              Volver
            </button>
          </>
        ) : (
          <>
            {modo === "login" ? (
              <>
                <h1>
                  Hola <em>de nuevo</em>
                </h1>
                <p className="adm-auth__sub">Tu panel de Amoma</p>
              </>
            ) : (
              <h1>Recuperar contraseña</h1>
            )}
            <div className="campo">
              <label htmlFor="adm-email">Email</label>
              <input
                id="adm-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {modo === "login" && (
              <div className="campo">
                <label htmlFor="adm-pass">Contraseña</label>
                <input
                  id="adm-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Turnstile onToken={onToken} />
            {error && (
              <p className="adm-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn btn--rosa"
              disabled={!puedeEnviar || enviando}
            >
              {enviando
                ? "Un momento…"
                : modo === "login"
                  ? "Entrar"
                  : "Enviar link"}
            </button>
            {/* "Olvidé mi contraseña" vuelve cuando esté el servicio de mail
                (hoy el link del mail no abre el panel: ver PENDIENTES) */}
            <p className="adm-auth__nota">
              Después te pedimos el código de tu celular, una sola vez por
              dispositivo.
            </p>
          </>
        )}
      </form>
    </main>
  );
}

export default Login;
