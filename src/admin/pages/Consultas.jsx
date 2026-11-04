import { useState } from "react";
import { cambiarEstadoConsulta, listarConsultas } from "../lib/api";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";

const ESTADOS = {
  new: "Nuevas",
  answered: "Respondidas",
  archived: "Archivadas",
  todas: "Todas",
};
const MOTIVOS = {
  torta: "Encargar una torta",
  evento: "Evento",
  consulta: "Consulta",
};

function Consultas() {
  const [filtro, setFiltro] = useState("new");
  const { cargando, error, datos, recargar } = useCarga(
    () => listarConsultas(filtro),
    [filtro],
  );
  const [aviso, setAviso] = useState("");

  const mover = async (id, status) => {
    setAviso("");
    try {
      await cambiarEstadoConsulta(id, status);
      recargar();
    } catch (e) {
      setAviso(e.message);
    }
  };

  return (
    <>
      <h1 className="adm-titulo">Consultas</h1>
      <div className="filtros">
        {Object.entries(ESTADOS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className="filtro"
            aria-pressed={filtro === k}
            onClick={() => setFiltro(k)}
          >
            {v}
          </button>
        ))}
      </div>
      {aviso && <p className="adm-error">{aviso}</p>}
      <Estado
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={datos && !datos.length && "No hay consultas acá."}
      >
        <ul className="adm-consultas">
          {datos?.map((c) => (
            <li key={c.id} className="adm-bloque">
              <p className="adm-consulta__cab">
                <strong>{c.name}</strong> · {MOTIVOS[c.reason]} ·{" "}
                {new Date(c.created_at).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              {c.message && <p className="adm-consulta__msg">{c.message}</p>}
              <p className="adm-consulta__datos">
                <a href={`mailto:${c.email}`}>{c.email}</a>
                {c.phone && (
                  <>
                    {" · "}
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp {c.phone}
                    </a>
                  </>
                )}
                {" · prefiere "}
                {c.contact_pref}
              </p>
              <div className="adm-acciones">
                {c.status !== "answered" && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => mover(c.id, "answered")}
                  >
                    Marcar respondida
                  </button>
                )}
                {c.status !== "archived" && (
                  <button
                    type="button"
                    className="btn btn--borde"
                    onClick={() => mover(c.id, "archived")}
                  >
                    Archivar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Estado>
    </>
  );
}

export default Consultas;
