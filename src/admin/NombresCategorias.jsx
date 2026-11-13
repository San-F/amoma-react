// Nombres de las 4 categorías (las tarjetas de la portada y los filtros del
// catálogo). Son fijas: no se agregan ni se borran, y la foto no cambia.
// Solo el nombre (máx. 30 letras; la base lo vuelve a controlar).
import { useEffect, useState } from "react";
import { listarCategorias, renombrarCategoria } from "./lib/api";

const MAX = 30;

function NombresCategorias() {
  const [categorias, setCategorias] = useState(null);
  const [nombres, setNombres] = useState({});
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const lista = await listarCategorias();
    setCategorias(lista);
    setNombres(Object.fromEntries(lista.map((c) => [c.id, c.name])));
  };

  useEffect(() => {
    cargar().catch((e) => setError(e.message));
  }, []);

  const cambiados = (categorias ?? []).filter(
    (c) => (nombres[c.id] ?? "").trim() !== c.name,
  );

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (cambiados.some((c) => !nombres[c.id].trim()))
      return setError("Ningún nombre puede quedar vacío.");
    setGuardando(true);
    try {
      for (const c of cambiados)
        await renombrarCategoria(c.id, nombres[c.id].trim());
      await cargar();
      setOk("Guardado ✓ Ya se ve en la página.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <details className="adm-bloque adm-categorias">
      <summary>Nombres de las categorías</summary>
      <p className="adm-ayuda">
        Son los títulos de las 4 tarjetas de la portada y de los filtros del
        catálogo. Las fotos de las tarjetas quedan como están.
      </p>
      {categorias && (
        <form className="adm-form" onSubmit={guardar}>
          {categorias.map((c) => (
            <div className="campo" key={c.id}>
              <label htmlFor={`cat-${c.id}`}>Tarjeta {c.sort_order}</label>
              <input
                id={`cat-${c.id}`}
                maxLength={MAX}
                value={nombres[c.id] ?? ""}
                onChange={(e) =>
                  setNombres({ ...nombres, [c.id]: e.target.value })
                }
              />
            </div>
          ))}
          {error && (
            <p className="adm-error" role="alert">
              {error}
            </p>
          )}
          {ok && <p className="adm-ok">{ok}</p>}
          <button className="btn" disabled={guardando || !cambiados.length}>
            {guardando ? "Guardando…" : "Guardar nombres"}
          </button>
        </form>
      )}
      {!categorias && error && <p className="adm-error">{error}</p>}
    </details>
  );
}

export default NombresCategorias;
