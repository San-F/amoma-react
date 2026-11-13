// Productos: tarjetas como en la página, agrupadas por categoría. Tocar una
// abre su ficha. Las sin foto tienen "+ Foto" (no se ven en la página).
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  agregarImagen,
  listarCategorias,
  listarProductos,
  renombrarCategoria,
} from "../lib/api";
import { validarImagen } from "../lib/images";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { Icono } from "../Iconos";
import { formatearPrecio } from "../../lib/money";
import Picture from "../../components/Picture";
import { categorias as tarjetasFijas } from "../../data/catalog";

// Cada categoría con el color y la foto de su tarjeta en la portada.
// `claro`: fondo de las tarjetas de productos de esa sección.
const CLAROS = {
  tortas: "#f7e6dc",
  postres: "#fbe3ea",
  salado: "#f6ecd2",
  personalizadas: "#efe7e2",
};
const SIN_CATEGORIA = {
  tono: { fondo: "#e9dfd6", texto: "#3b2420" },
  claro: "#f4eadf",
};
const estiloDe = (slug) => {
  const t = tarjetasFijas.find((c) => c.id === slug);
  return {
    tarjeta: t,
    tono: t?.tono ?? SIN_CATEGORIA.tono,
    claro: CLAROS[slug] ?? SIN_CATEGORIA.claro,
  };
};
const MAX_NOMBRE = 30;

async function cargar() {
  const [productos, categorias] = await Promise.all([
    listarProductos(),
    listarCategorias(),
  ]);
  return { productos, categorias };
}

// Título de una categoría: tocando "Cambiar nombre" se edita ahí mismo.
// Las 4 categorías son fijas (no se agregan ni se borran; la foto no cambia).
function TituloCategoria({ categoria, onGuardado, onError }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(categoria.name);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return onError("El nombre no puede quedar vacío.");
    setGuardando(true);
    try {
      if (limpio !== categoria.name)
        await renombrarCategoria(categoria.id, limpio);
      setEditando(false);
      onGuardado();
    } catch (err) {
      onError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!editando)
    return (
      <div className="adm-cat">
        <h2>{categoria.name}</h2>
        <button
          type="button"
          className="adm-cat__lapiz"
          aria-label={`Cambiar nombre de ${categoria.name}`}
          title="Cambiar nombre"
          onClick={() => {
            setNombre(categoria.name);
            setEditando(true);
          }}
        >
          <Icono nombre="lapiz" width={18} height={18} />
        </button>
      </div>
    );

  return (
    <form className="adm-cat adm-cat--editando" onSubmit={guardar}>
      <input
        aria-label={`Nombre de la categoría ${categoria.name}`}
        value={nombre}
        maxLength={MAX_NOMBRE}
        autoFocus
        onChange={(e) => setNombre(e.target.value)}
      />
      <button className="btn" disabled={guardando}>
        {guardando ? "…" : "Guardar"}
      </button>
      <button
        type="button"
        className="adm-cat__cancelar"
        onClick={() => setEditando(false)}
      >
        Cancelar
      </button>
      <small>
        Se ve en la tarjeta de la portada y en el filtro del catálogo.
      </small>
    </form>
  );
}

function Productos() {
  const { cargando, error, datos, recargar } = useCarga(cargar);
  const [filtro, setFiltro] = useState("todas");
  const [aviso, setAviso] = useState("");
  const [subiendo, setSubiendo] = useState(null); // id del producto

  const productos = datos?.productos ?? [];
  const categorias = datos?.categorias ?? [];
  const sinFoto = productos.filter((p) => !p.portada);

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

  // grupos en el orden de las categorías; lo que no tiene categoría, al final
  const grupos = [
    ...categorias.map((c) => ({
      categoria: c,
      productos: productos.filter((p) => p.category_id === c.id),
    })),
    {
      categoria: null,
      productos: productos.filter(
        (p) => !categorias.some((c) => c.id === p.category_id),
      ),
    },
  ].filter(
    (g) =>
      (filtro === "todas" || g.categoria?.id === filtro) &&
      (g.categoria || g.productos.length),
  );

  return (
    <>
      <div className="adm-cabecera">
        <h1 className="adm-titulo">Productos</h1>
        <div className="adm-cabecera__botones">
          <Link className="btn btn--borde" to="/admin/importar">
            <Icono nombre="planilla" width={18} height={18} /> Excel
          </Link>
          <Link className="btn btn--rosa" to="/admin/productos/nuevo">
            <Icono nombre="mas" width={18} height={18} /> Agregar
          </Link>
        </div>
      </div>

      {aviso && (
        <p className="adm-error" role="alert">
          {aviso}
        </p>
      )}

      <Estado
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={
          datos &&
          !productos.length &&
          "Todavía no hay productos. Tocá “Agregar” o cargalos con la planilla de Excel."
        }
      >
        <div className="adm-chips" role="group" aria-label="Ver categoría">
          {[{ id: "todas", name: "Todos" }, ...categorias].map((c) => (
            <button
              key={c.id}
              type="button"
              className="adm-chip"
              aria-pressed={filtro === c.id}
              onClick={() => setFiltro(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {sinFoto.length > 0 && (
          <p className="adm-aviso">
            {sinFoto.length === 1
              ? "Hay 1 producto sin foto"
              : `Hay ${sinFoto.length} productos sin foto`}
            : no se ven en la página hasta que les pongas una. Tocá “+ Foto”.
          </p>
        )}

        {grupos.map((g) => {
          const { tarjeta, tono, claro } = estiloDe(g.categoria?.slug);
          return (
            <section
              key={g.categoria?.id ?? "sin"}
              className="adm-grupo"
              style={{
                "--cat-fondo": tono.fondo,
                "--cat-texto": tono.texto,
                "--cat-claro": claro,
              }}
            >
              <header className="adm-grupo__cabecera">
                {tarjeta && (
                  <span className="adm-grupo__foto">
                    <Picture foto={tarjeta.foto} sizes="3rem" />
                  </span>
                )}
                {g.categoria ? (
                  <TituloCategoria
                    categoria={g.categoria}
                    onGuardado={recargar}
                    onError={setAviso}
                  />
                ) : (
                  <div className="adm-cat">
                    <h2>Sin categoría</h2>
                  </div>
                )}
              </header>
              <div className="adm-grupo__cuerpo">
                {!g.productos.length ? (
                  <p className="adm-ayuda">Todavía no hay productos acá.</p>
                ) : (
                  <ul className="adm-grilla">
                    {g.productos.map((p) => (
                      <li
                        key={p.id}
                        className={`adm-prod ${p.is_published ? "" : "adm-prod--oculto"}`}
                      >
                        <Link
                          to={`/admin/productos/${p.id}`}
                          className="adm-prod__link"
                        >
                          <span className="adm-prod__circulo">
                            {p.portada ? <img src={p.portada} alt="" /> : null}
                          </span>
                          <span className="adm-prod__nombre">{p.name}</span>
                          <span className="adm-prod__precio">
                            {p.desde != null
                              ? `desde ${formatearPrecio(p.desde)}`
                              : "Sin precio"}
                          </span>
                        </Link>
                        {!p.is_published && (
                          <span className="adm-etiqueta adm-prod__etiqueta">
                            Oculto
                          </span>
                        )}
                        {!p.portada && (
                          <label
                            className="adm-prod__foto"
                            aria-busy={subiendo === p.id}
                          >
                            {subiendo === p.id ? "Subiendo…" : "+ Foto"}
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </Estado>
    </>
  );
}

export default Productos;
