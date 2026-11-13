import { useEffect, useRef, useState } from "react";
import Palabras from "../components/Palabras";
import { useSearchParams } from "react-router-dom";
import Picture from "../components/Picture";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { filtros, tamanos } from "../data/catalog";
import { linkWhatsApp } from "../lib/whatsapp";
import { formatearPrecio } from "../lib/money";
import { conTransicion } from "../lib/transicion";
import {
  abrirHojaPedido,
  agregarAlPedido,
  opcionesDe,
  usePedido,
} from "../lib/pedido";
import { useSitio } from "../lib/sitio";
import "../styles/Catalog.css";

const ETIQUETAS = {
  "mas-pedido": "Más pedido",
  nuevo: "Nuevo",
  temporada: "De temporada",
};
const NOMBRE_FILTRO = Object.fromEntries(filtros.map((f) => [f.id, f.nombre]));

// precio más bajo cargado (para "desde $…" en la tarjeta)
const desde = (p) => {
  const precios = (p.variantes ?? [])
    .map((v) => v.precio)
    .filter((x) => x != null);
  return precios.length ? Math.min(...precios) : null;
};

// al abrir un producto queda elegida la opción más chica (la del "desde $…")
const masChica = (p) => {
  const vs = p.variantes ?? [];
  if (!vs.length) return "chica";
  const conPrecio = vs.filter((v) => v.precio != null);
  if (!conPrecio.length) return vs[0].id;
  return conPrecio.reduce((a, b) => (b.precio < a.precio ? b : a)).id;
};

function Catalog() {
  const [params] = useSearchParams();
  const { negocio, productos: productosSitio, nombresCategorias } = useSitio();
  // nombre que eligió la dueña para cada categoría ("Todas" queda fijo)
  const nombreFiltro = (id) => nombresCategorias[id] ?? NOMBRE_FILTRO[id];
  const productos = productosSitio;
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  const pedido = params.get("categoria");
  const desdeUrl = NOMBRE_FILTRO[pedido] ? pedido : "todas";
  const [filtro, setFiltro] = useState(desdeUrl);
  const gridRef = useRef(null);
  // si llegan desde un link con ?categoria=…, se aplica ese filtro
  useEffect(() => setFiltro(desdeUrl), [desdeUrl]);
  const lista =
    filtro === "todas"
      ? productos
      : productos.filter((p) => p.categoria === filtro);

  const [abierto, setAbierto] = useState(null);
  const [tamano, setTamano] = useState("chica");
  const [agregado, setAgregado] = useState(false);
  const [cant, setCant] = useState(1);
  const enPedido = usePedido();
  const timerCierre = useRef(null);
  const dialogRef = useRef(null);
  const fotosRef = useRef({});

  const abrir = (p) => {
    clearTimeout(timerCierre.current);
    const foto = fotosRef.current[p.id];
    if (foto) foto.style.viewTransitionName = "foto-producto";
    conTransicion(() => {
      if (foto) foto.style.viewTransitionName = "";
      setAbierto(p);
      setAgregado(false);
      setCant(1);
      setTamano(masChica(p));
      dialogRef.current?.showModal();
    }, "vt-detalle");
  };

  const cerrar = () => {
    clearTimeout(timerCierre.current);
    const foto = abierto && fotosRef.current[abierto.id];
    const t = conTransicion(() => {
      dialogRef.current?.close();
      setAbierto(null);
      if (foto) foto.style.viewTransitionName = "foto-producto";
    }, "vt-detalle");
    const limpiar = () => foto && (foto.style.viewTransitionName = "");
    if (t) return t.finished.finally(limpiar);
    limpiar();
    return Promise.resolve();
  };

  // las tarjetas se deslizan a su nuevo lugar. Los nombres de transición
  // solo se activan durante el filtrado (clase "filtrando"): si quedaran
  // puestos, al abrir el detalle las tarjetas se dibujarían encima del panel.
  const elegirFiltro = (id) => {
    if (id === filtro) return;
    const grid = gridRef.current;
    grid?.classList.add("filtrando");
    const t = conTransicion(() => setFiltro(id));
    const limpiar = () => grid?.classList.remove("filtrando");
    if (t) t.finished.finally(limpiar);
    else limpiar();
  };

  // tamaños reales (cargados por la dueña) o los genéricos de ejemplo
  const opciones = abierto?.variantes?.length
    ? abierto.variantes.map((v) => ({
        id: v.id,
        nombre: v.nombre,
        detalle: v.porciones ? `${v.porciones} porciones` : "",
        precio: v.precio,
      }))
    : tamanos;
  const tamanoElegido = opciones.find((t) => t.id === tamano) ?? opciones[0];

  const yaEnPedido = abierto ? enPedido.filter((x) => x.id === abierto.id) : [];

  const hayPrecio = tamanoElegido?.precio != null;
  const algunPrecio = opciones.some((o) => o.precio != null);

  // "seguir": agrega, confirma con el botón y vuelve al catálogo.
  // "ahora": agrega y abre la hoja del pedido para poner fecha y enviar.
  const agregar = (modo) => {
    if (agregado) return;
    const foto = abierto.foto?.picture?.img.src ?? abierto.foto?.src ?? null;
    agregarAlPedido({
      id: abierto.id,
      nombre: abierto.nombre,
      variante: tamanoElegido.nombre,
      precio: tamanoElegido.precio ?? null,
      foto,
      opciones: opcionesDe(abierto, tamanos),
      cantidad: cant,
    });
    setAgregado(modo);
    if (modo === "ahora") cerrar().then(abrirHojaPedido);
    else timerCierre.current = setTimeout(cerrar, 650);
  };

  return (
    <section
      id="tortas"
      className="catalogo seccion"
      aria-labelledby="catalogo-titulo"
    >
      <div className="contenedor">
        <Reveal className="catalogo__cabecera">
          <div>
            <p className="eyebrow">Nuestro catálogo</p>
            <h2 id="catalogo-titulo">
              <Palabras>
                Tocá una y <em>conocela</em>
              </Palabras>
            </h2>
          </div>
          <div className="filtros" role="group" aria-label="Filtrar">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                className="filtro"
                aria-pressed={filtro === f.id}
                onClick={() => elegirFiltro(f.id)}
              >
                {nombreFiltro(f.id)}
              </button>
            ))}
          </div>
        </Reveal>

        {!lista.length && (
          <p className="catalogo__vacio" role="status">
            Pronto vas a ver acá esta sección. Mientras tanto,{" "}
            <a
              href={wa(
                "¡Hola Amoma! Quería consultar por: " +
                  nombreFiltro(filtro) +
                  ".",
              )}

              target="_blank"

              rel="noopener noreferrer"
            >
              consultanos por WhatsApp
            </a>
            .
          </p>
        )}

        <ul className="catalogo__grid" ref={gridRef}>
          {lista.map((p, i) => (
            <li
              key={p.id}
              className="sabor"
              style={{ "--i": i, "--vt": `sabor-${p.id}` }}
            >
              <button
                type="button"
                className="sabor__btn"
                onClick={() => abrir(p)}
              >
                <span
                  className="sabor__foto"
                  ref={(el) => (fotosRef.current[p.id] = el)}
                >
                  <Picture
                    foto={p.foto}
                    sizes="(min-width: 64rem) 16rem, 42vw"
                  />
                </span>
                <span className="sabor__nombre">{p.nombre}</span>
                {desde(p) != null && (
                  <span className="sabor__precio">
                    desde {formatearPrecio(desde(p))}
                  </span>
                )}
                {p.etiqueta && ETIQUETAS[p.etiqueta] && (
                  <span className={`etiqueta etiqueta--${p.etiqueta}`}>
                    {ETIQUETAS[p.etiqueta]}
                  </span>
                )}
                <span className="sabor__mas" aria-hidden="true">
                  +
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="detalle"
        aria-labelledby="detalle-titulo"
        onCancel={(e) => {
          e.preventDefault();
          cerrar();
        }}
        onClick={(e) => e.target === e.currentTarget && cerrar()}
      >
        {abierto && (
          <div className="detalle__panel">
            <div className="detalle__foto">
              <Picture
                foto={abierto.foto}
                sizes="(min-width: 56rem) 26rem, 80vw"
                loading="eager"
              />
            </div>
            <div className="detalle__info">
              <p className="eyebrow">{nombreFiltro(abierto.categoria)}</p>
              <h3 id="detalle-titulo">{abierto.nombre}</h3>
              <p className="detalle__desc">{abierto.descripcion}</p>

              <fieldset className="detalle__tamanos">
                <legend>Tamaño</legend>
                {opciones.map((t) => (
                  <label key={t.id} className="tamano">
                    <input
                      type="radio"
                      name="tamano"
                      value={t.id}
                      checked={tamanoElegido?.id === t.id}
                      onChange={() => setTamano(t.id)}
                    />
                    <span>{t.nombre}</span>
                    {t.detalle && <small>{t.detalle}</small>}
                    {t.precio != null && (
                      <small className="tamano__precio">
                        {formatearPrecio(t.precio)}
                      </small>
                    )}
                  </label>
                ))}
              </fieldset>
              <div className="detalle__compra">
                <div
                  className="detalle__cant"
                  role="group"
                  aria-label="Cantidad"
                >
                  <button
                    type="button"
                    onClick={() => setCant((c) => Math.max(c - 1, 1))}
                    disabled={cant <= 1}
                    aria-label="Uno menos"
                  >
                    −
                  </button>
                  <span aria-live="polite">{cant}</span>
                  <button
                    type="button"
                    onClick={() => setCant((c) => Math.min(c + 1, 99))}
                    disabled={cant >= 99}
                    aria-label="Uno más"
                  >
                    +
                  </button>
                </div>
                <p className="detalle__precio">
                  {hayPrecio ? (
                    <strong>
                      {formatearPrecio(tamanoElegido.precio * cant)}
                    </strong>
                  ) : (
                    <span>
                      {algunPrecio
                        ? "Este tamaño: precio a confirmar"
                        : "Te confirmamos el precio por WhatsApp"}
                    </span>
                  )}
                </p>
              </div>
              {yaEnPedido.length > 0 && (
                <p className="detalle__ya">
                  Ya tenés en tu pedido:{" "}
                  {yaEnPedido
                    .map((x) => `${x.cantidad} ${x.variante ?? ""}`.trim())
                    .join(" · ")}
                </p>
              )}
              <div className="detalle__botones">
                <button
                  type="button"
                  className={`btn btn--borde detalle__seguir ${agregado === "seguir" ? "is-agregado" : ""}`}
                  onClick={() => agregar("seguir")}
                  disabled={!!agregado}
                >
                  {agregado === "seguir" ? "✓ Agregado" : "Agregar y seguir"}
                </button>
                <button
                  type="button"
                  className="btn btn--rosa detalle__cta"
                  onClick={() => agregar("ahora")}
                  disabled={!!agregado}
                >
                  Pedir ahora
                </button>
              </div>
            </div>
            <button
              type="button"
              className="detalle__cerrar"
              onClick={cerrar}
              autoFocus
            >
              <Icon name="close" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}

export default Catalog;
