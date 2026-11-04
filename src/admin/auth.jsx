// Estado de autenticación del panel.
// Ojo: esto decide QUÉ PANTALLA mostrar. La seguridad real la impone la base
// (RLS + is_admin() con MFA): aunque alguien manipule el front, la base rechaza.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const INACTIVIDAD_MS = 30 * 60 * 1000; // cierre de sesión tras 30 min sin uso

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [estado, setEstado] = useState(null); // { is_member, has_mfa }

  const refrescarEstado = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_status");
    if (error) {
      setEstado({ is_member: false, has_mfa: false, error: true });
      return;
    }
    setEstado(data?.[0] ?? { is_member: false, has_mfa: false });
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_evento, s) =>
      setSession(s ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refrescarEstado();
    else setEstado(null);
  }, [session, refrescarEstado]);

  // cierre automático por inactividad
  useEffect(() => {
    if (!session) return;
    let timer;
    const reiniciar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => supabase.auth.signOut(), INACTIVIDAD_MS);
    };
    const eventos = ["pointerdown", "keydown", "scroll"];
    eventos.forEach((e) =>
      window.addEventListener(e, reiniciar, { passive: true }),
    );
    reiniciar();
    return () => {
      clearTimeout(timer);
      eventos.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [session]);

  const salir = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        session,
        estado,
        cargando: session === undefined,
        refrescarEstado,
        salir,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Mensaje genérico: no revelar si el email existe ni detalles internos.
export function mensajeError(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  }
  if (m.includes("captcha"))
    return "No pudimos verificar que no sos un robot. Probá de nuevo.";
  if (m.includes("expired") || (m.includes("invalid") && m.includes("token"))) {
    return "El link venció o ya se usó. Pedí uno nuevo.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "No hay conexión. Revisá internet y probá de nuevo.";
  }
  return "Algo salió mal. Probá de nuevo en unos minutos.";
}
