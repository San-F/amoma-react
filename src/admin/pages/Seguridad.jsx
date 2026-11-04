// Segundo factor (TOTP): la primera vez se configura escaneando un QR con
// Google Authenticator / Microsoft Authenticator; después se pide el código.
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { mensajeError, useAuth } from "../auth";
import { qrSeguro } from "../lib/qr";

function Seguridad() {
  const { session, estado, refrescarEstado, salir } = useAuth();
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState(null);
  const [qr, setQr] = useState(null); // solo al configurar por primera vez
  const [secreto, setSecreto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // solo una cuenta de la lista de admins configura el doble factor
    if (!session || !estado?.is_member) return;
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return setError(mensajeError(error));
      const verificado = data.totp.find((f) => f.status === "verified");
      if (verificado) return setFactorId(verificado.id);
      // limpiar intentos de configuración que quedaron a medias
      for (const f of data.all.filter((f) => f.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const res = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Amoma",
      });
      if (res.error) return setError(mensajeError(res.error));
      setFactorId(res.data.id);
      setQr(qrSeguro(res.data.totp.qr_code));
      setSecreto(res.data.totp.secret);
    })();
  }, [session, estado?.is_member]);

  if (!session) return <Navigate to="/admin/ingresar" replace />;
  if (estado?.has_mfa) return <Navigate to="/admin" replace />;

  const verificar = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) return setError("El código tiene 6 números.");
    setEnviando(true);
    setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codigo,
    });
    setEnviando(false);
    if (error) {
      setCodigo("");
      return setError(
        "Código incorrecto o vencido. Probá con el que muestra la app ahora.",
      );
    }
    await refrescarEstado();
    navigate("/admin", { replace: true });
  };

  return (
    <main className="adm-auth">
      <form className="adm-auth__caja" onSubmit={verificar}>
        <p className="adm-auth__marca">Amoma · Panel</p>
        {estado && !estado.is_member ? (
          <>
            <h1>Sin acceso</h1>
            <p>Esta cuenta no tiene permiso para administrar la página.</p>
            <button type="button" className="btn" onClick={salir}>
              Salir
            </button>
          </>
        ) : (
          <>
            <h1>{qr ? "Activá el doble factor" : "Código de seguridad"}</h1>
            {qr ? (
              <>
                <ol className="adm-pasos">
                  <li>
                    Instalá Google Authenticator o Microsoft Authenticator en tu
                    celular.
                  </li>
                  <li>Tocá “+” y escaneá este código.</li>
                  <li>Escribí abajo los 6 números que aparecen.</li>
                </ol>
                <img
                  className="adm-qr"
                  src={qr}
                  alt="Código QR para la app de autenticación"
                />
                <details className="adm-ayuda">
                  <summary>¿No podés escanear?</summary>
                  <p>
                    Cargá esta clave a mano: <code>{secreto}</code>
                  </p>
                </details>
              </>
            ) : (
              <p>
                Abrí tu app de autenticación y escribí el código de 6 números.
              </p>
            )}
            <div className="campo">
              <label htmlFor="mfa">Código</label>
              <input
                id="mfa"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
            {error && (
              <p className="adm-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn"
              disabled={!factorId || codigo.length !== 6 || enviando}
            >
              {enviando ? "Verificando…" : "Verificar"}
            </button>
            <button type="button" className="adm-link" onClick={salir}>
              Salir
            </button>
          </>
        )}
      </form>
    </main>
  );
}

export default Seguridad;
