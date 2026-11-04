import { useState } from "react";
import { Link } from "react-router-dom";
import { cambiarPublicado, listarProductos } from "../lib/api";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { formatearPrecio } from "../../lib/money";

function Productos() {
  const { cargando, error, datos, recargar } = useCarga(listarProductos);
  const [buscar, setBuscar] = useState("");
  const [aviso, setAviso] = useState("");

  const lista = (datos ?? []).filter((p) =>
    p.name.toLowerCase().includes(buscar.trim().toLowerCase()),
  );

  const alternar = async (p) => {
    setAviso("");
    try {
      await cambiarPublicado(p.id, !p.is_published);
      recargar();
    } catch (e) {
      setAviso(e.message);
    }
  };

  return (
    <>
      <div className="adm-cabecera">
        <h1 className="adm-titulo">Productos</h1>
        <Link className="btn" to="/admin/productos/nuevo">
          + Nuevo
        </Link>
      </div>
      <input
        className="adm-buscar"
        type="search"
        placeholder="Buscar…"
        aria-label="Buscar productos"
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />
      {aviso && <p className="adm-error">{aviso}</p>}
      <Estado
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={
          datos &&
          !lista.length &&
          (buscar
            ? "Nada coincide con la búsqueda."
            : "Todavía no hay productos. Creá uno o cargalos desde Excel.")
        }
      >
        <ul className="adm-lista">
          {lista.map((p) => (
            <li key={p.id} className="adm-fila">
              {p.portada ? (
                <img src={p.portada} alt="" className="adm-mini" />
              ) : (
                <span className="adm-mini adm-mini--vacia" />
              )}
              <div className="adm-fila__info">
                <Link
                  to={`/admin/productos/${p.id}`}
                  className="adm-fila__nombre"
                >
                  {p.name}
                </Link>
                <span>
                  {p.category?.name ?? "Sin categoría"}
                  {p.desde != null && ` · desde ${formatearPrecio(p.desde)}`}
                </span>
              </div>
              <label className="adm-switch">
                <input
                  type="checkbox"
                  checked={p.is_published}
                  onChange={() => alternar(p)}
                />
                <span>{p.is_published ? "Visible" : "Oculto"}</span>
              </label>
            </li>
          ))}
        </ul>
      </Estado>
    </>
  );
}

export default Productos;
