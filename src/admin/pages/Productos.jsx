import { useState } from "react";
import { Link } from "react-router-dom";
import { agregarImagen, cambiarPublicado, listarProductos } from "../lib/api";
import { validarImagen } from "../lib/images";
import NombresCategorias from "../NombresCategorias";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { formatearPrecio } from "../../lib/money";

function Productos() {
  const { cargando, error, datos, recargar } = useCarga(listarProductos);
  const [buscar, setBuscar] = useState("");
  const [aviso, setAviso] = useState("");
  const [subiendo, setSubiendo] = useState(null); // id del producto

  // productos visibles que todavía no tienen foto: no aparecen en la página
  const sinFoto = (datos ?? []).filter((p) => !p.portada);

  // poner la foto tocando el producto (sin nombres de archivo ni planilla)
  const ponerFoto = async (p, e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setAviso("");
    const problema = validarImagen(f);
    if (problema) return setAviso(problema);
    setSubiendo(p.id);
    try {
      await agregarImagen(p.id, f, p.name, true);
      recargar();
    } catch (err) {
      setAviso(err.message);
    } finally {
      setSubiendo(null);
    }
  };

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
      <NombresCategorias />
      <input
        className="adm-buscar"
        type="search"
        placeholder="Buscar…"
        aria-label="Buscar productos"
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />
      {aviso && (
        <p className="adm-error" role="alert">
          {aviso}
        </p>
      )}
      {sinFoto.length > 0 && (
        <p className="adm-aviso">
          {sinFoto.length === 1
            ? "Hay 1 producto sin foto"
            : `Hay ${sinFoto.length} productos sin foto`}
          : no se ven en la página hasta que les pongas una. Tocá “+ Foto”.
        </p>
      )}
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
                <label
                  className="adm-mini adm-mini--vacia adm-mini--subir"
                  aria-busy={subiendo === p.id}
                >
                  {subiendo === p.id ? "…" : "+ Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Poner foto a ${p.name}`}
                    disabled={subiendo !== null}
                    onChange={(e) => ponerFoto(p, e)}
                    hidden
                  />
                </label>
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
                  {p.desde != null
                    ? ` · desde ${formatearPrecio(p.desde)}`
                    : " · sin precio"}
                  {!p.portada && " · sin foto"}
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
