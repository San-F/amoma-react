import { useState } from "react";
import { guardarCategoria, listarCategorias } from "../lib/api";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { slugify } from "../../lib/slug";

function Categorias() {
  const { cargando, error, datos, recargar } = useCarga(listarCategorias);
  const [nueva, setNueva] = useState("");
  const [aviso, setAviso] = useState("");

  const guardar = async (cat) => {
    setAviso("");
    try {
      await guardarCategoria(cat);
      recargar();
    } catch (e) {
      setAviso(e.message);
    }
  };

  const crear = (e) => {
    e.preventDefault();
    const name = nueva.trim();
    if (!name) return;
    guardar({
      name,
      slug: slugify(name),
      is_published: true,
      sort_order: (datos?.length ?? 0) + 1,
    });
    setNueva("");
  };

  return (
    <>
      <h1 className="adm-titulo">Categorías</h1>
      {aviso && <p className="adm-error">{aviso}</p>}
      <Estado cargando={cargando} error={error} onReintentar={recargar}>
        <ul className="adm-lista">
          {datos?.map((c) => (
            <li key={c.id} className="adm-fila">
              <div className="adm-fila__info">
                <input
                  className="adm-inline"
                  aria-label={`Nombre de ${c.name}`}
                  defaultValue={c.name}
                  maxLength={80}
                  onBlur={(e) =>
                    e.target.value.trim() &&
                    e.target.value !== c.name &&
                    guardar({ id: c.id, name: e.target.value.trim() })
                  }
                />
                <span>
                  Para la planilla: “{c.name}” o “{c.slug}”
                </span>
              </div>
              <label className="adm-switch">
                <input
                  type="checkbox"
                  checked={c.is_published}
                  onChange={() =>
                    guardar({ id: c.id, is_published: !c.is_published })
                  }
                />
                <span>{c.is_published ? "Visible" : "Oculta"}</span>
              </label>
            </li>
          ))}
        </ul>
      </Estado>
      <form className="adm-acciones" onSubmit={crear}>
        <input
          className="adm-inline"
          placeholder="Nueva categoría"
          aria-label="Nueva categoría"
          maxLength={80}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
        />
        <button className="btn">Agregar</button>
      </form>
    </>
  );
}

export default Categorias;
