import { useCallback, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { mensajeError, useAuth } from "../auth";
import Turnstile, { turnstileActivo } from "../Turnstile";

function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const onToken = useCallback((t) => setCaptcha(t), []);

  if (session)
    return <Navigate to={location.state?.desde ?? "/admin"} replace />;

  const puedeEnviar = email && password && (!turnstileActivo || captcha);

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError("");
    const options = captcha ? { captchaToken: captcha } : undefined;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options,
    });
    if (error) setError(mensajeError(error));
    setEnviando(false);
  };

  return (
    <main className="adm-auth">
      <form className="adm-auth__caja" onSubmit={enviar}>
        <img className="adm-auth__logo" src="/logo.png" alt="Amoma" />
        <h1>
          Hola <em>de nuevo</em>
        </h1>
        <p className="adm-auth__sub">Tu panel de Amoma</p>
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
          {enviando ? "Un momento…" : "Entrar"}
        </button>
        {/* "Olvidé mi contraseña" vuelve cuando esté el servicio de mail: la
            pantalla que recibe el link ya existe (Acceso.jsx). Ver PENDIENTES. */}
        <p className="adm-auth__nota">
          Después te pedimos el código de tu celular, una sola vez por
          dispositivo.
        </p>
      </form>
    </main>
  );
}

export default Login;
