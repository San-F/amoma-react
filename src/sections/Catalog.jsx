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
import { useSitio } from "../lib/sitio";
import "../styles/Catalog.css";

const NOMBRE_FILTRO = Object.fromEntries(filtros.map((f) => [f.id, f.nombre]));

function Catalog() {
  const { negocio, productos } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  const [params] = useSearchParams();
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
  const [tamano, setTamano] = useState("mediana");
  const dialogRef = useRef(null);
  const fotosRef = useRef({});

  const abrir = (p) => {
    const foto = fotosRef.current[p.id];
    if (foto) foto.style.viewTransitionName = "foto-producto";
    conTransicion(() => {
      if (foto) foto.style.viewTransitionName = "";
      setAbierto(p);
      setTamano(p.variantes?.[0]?.id ?? "mediana");
      dialogRef.current?.showModal();
    }, "vt-detalle");
  };

  const cerrar = () => {
    const foto = abierto && fotosRef.current[abierto.id];
    const t = conTransicion(() => {
      dialogRef.current?.close();
      setAbierto(null);
      if (foto) foto.style.viewTransitionName = "foto-producto";
    }, "vt-detalle");
    const limpiar = () => foto && (foto.style.viewTransitionName = "");
    if (t) t.finished.finally(limpiar);
    else limpiar();
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
        detalle: [
          v.porciones && `${v.porciones} porciones`,
          formatearPrecio(v.precio),
        ]
          .filter(Boolean)
          .join(" · "),
        precio: v.precio,
      }))
    : tamanos;
  const tamanoElegido = opciones.find((t) => t.id === tamano) ?? opciones[0];

  return (
    <section
      id="tortas"
      className="catalogo seccion"
      aria-labelledby="catalogo-titulo"
    >
      <div className="contenedor">
        <Reveal className="catalogo__cabecera">
          <div>
            <p className="eyebrow">Nuestras tortas</p>
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
                {f.nombre}
              </button>
            ))}
          </div>
        </Reveal>

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
              <p className="eyebrow">{NOMBRE_FILTRO[abierto.categoria]}</p>
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
                    <small>{t.detalle}</small>
                  </label>
                ))}
              </fieldset>

              <a
                className="btn btn--rosa detalle__cta"
                href={wa(
                  `¡Hola Amoma! Quiero encargar: ${abierto.nombre}, tamaño ${tamanoElegido.nombre.toLowerCase()} (${tamanoElegido.detalle}). ¿Me confirman disponibilidad?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" /> Pedir por WhatsApp
              </a>
              <p className="detalle__nota">
                Te respondemos con el precio y las fechas disponibles.
              </p>
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
