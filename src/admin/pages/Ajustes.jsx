import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { guardarAjustes, obtenerAjustes } from "../lib/api";
import { useAuth } from "../auth";

const CAMPOS = [
  {
    name: "whatsapp",
    label: "WhatsApp",
    ayuda: "Solo números, con 549 adelante. Ej.: 5491136362466",
    max: 15,
  },
  {
    name: "instagram",
    label: "Instagram",
    ayuda: "Sin @. Ej.: amoma.cakeshop",
    max: 60,
  },
  { name: "email", label: "Email", max: 254 },
  {
    name: "address",
    label: "Zona / dirección",
    ayuda: "Lo que querés mostrar. Ej.: Villa Pueyrredón, CABA",
    max: 200,
  },
  {
    name: "hours",
    label: "Horarios",
    ayuda: "Ej.: Martes a sábado de 10 a 19 h",
    max: 300,
  },
  {
    name: "notice",
    label: "Aviso destacado",
    ayuda:
      "Aparece arriba de todo en la página. Dejalo vacío para ocultarlo. Ej.: Agenda de diciembre completa",
    max: 300,
  },
];

function Ajustes() {
  const { session, salir } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerAjustes().then(setDatos, (e) => setError(e.message));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    // se acepta pegado de cualquier forma: "@amoma", la dirección completa…
    const whatsapp = (datos.whatsapp ?? "").replace(/\D/g, "");
    const instagram = (datos.instagram ?? "")
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/[/?#].*$/, "");
    const email = (datos.email ?? "").trim();
    if (whatsapp && !/^\d{8,15}$/.test(whatsapp))
      return setError("El WhatsApp va solo con números (8 a 15).");
    if (instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(instagram))
      return setError(
        "Revisá el Instagram: va solo el usuario (ej. amoma.cakeshop).",
      );
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setError("Revisá el email: parece tener un error.");
    setGuardando(true);
    try {
      const corregido = { ...datos, whatsapp, instagram, email };
      setDatos(corregido);
      const limpio = Object.fromEntries(
        Object.entries(corregido).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() || null : v,
        ]),
      );
      await guardarAjustes(limpio);
      setOk("Guardado ✓");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!datos)
    return error ? (
      <p className="adm-error">{error}</p>
    ) : (
      <p className="adm-cargando">Cargando…</p>
    );

  return (
    <>
      <h1 className="adm-titulo">Ajustes</h1>
      <section className="adm-bloque">
        <h2>Tu cuenta</h2>
        <p className="adm-ayuda">
          Entraste como <b>{session?.user?.email}</b>. En este dispositivo la
          sesión queda abierta hasta que toques “Salir”.
        </p>
        <div className="adm-acciones">
          <a
            className="btn btn--borde"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver la página ↗
          </a>
          <Link className="btn btn--borde" to="/admin/consultas">
            Consultas
          </Link>
          <button type="button" className="btn" onClick={salir}>
            Salir
          </button>
        </div>
      </section>
      <h2 className="adm-ficha__sub">Datos del negocio</h2>
      <form className="adm-form adm-bloque" onSubmit={guardar}>
        {CAMPOS.map((c) => (
          <div className="campo" key={c.name}>
            <label htmlFor={c.name}>{c.label}</label>
            <input
              id={c.name}
              maxLength={c.max}
              value={datos[c.name] ?? ""}
              onChange={(e) => setDatos({ ...datos, [c.name]: e.target.value })}
            />
            {c.ayuda && <small>{c.ayuda}</small>}
          </div>
        ))}
        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        {ok && <p className="adm-ok">{ok}</p>}
        <button className="btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </>
  );
}

export default Ajustes;
