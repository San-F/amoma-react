import { useEffect, useState } from "react";
import { guardarAjustes, obtenerAjustes } from "../lib/api";

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
    if (datos.whatsapp && !/^\d{8,15}$/.test(datos.whatsapp))
      return setError("El WhatsApp va solo con números (8 a 15).");
    setGuardando(true);
    try {
      const limpio = Object.fromEntries(
        Object.entries(datos).map(([k, v]) => [
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
      <h1 className="adm-titulo">Ajustes del negocio</h1>
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
