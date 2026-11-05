import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import {
  cambiarCantidad,
  cambiarVariante,
  conCatalogo,
  EVENTO_ABRIR,
  mensajePedido,
  restaurar,
  resumenPedido,
  usePedido,
  vaciarPedido,
} from "../lib/pedido";
import { formatearPrecio } from "../lib/money";
import { fechaMinima, linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import { tamanos } from "../data/catalog";

const DIAS_AVISO = 2;
import "../styles/Pedido.css";

// Pastilla "Tu pedido" + hoja para revisar y mandar todo en un solo WhatsApp.
function PedidoFlotante() {
  const uid = useId();
  const guardados = usePedido();
  const { negocio, productos, listo } = useSitio();
  // nombre, precio y tamaños siempre del catálogo actual
  const items = conCatalogo(guardados, productos, {
    genericos: tamanos,
    definitivo: listo,
  });
  const { unidades, total, subtotal, aConfirmar, problemas } =
    resumenPedido(items);
  const [quitado, setQuitado] = useState(null);
  const minimo = fechaMinima(DIAS_AVISO);
  const dialogRef = useRef(null);
  const [datos, setDatos] = useState({ fecha: "", nombre: "", nota: "" });
  const [salta, setSalta] = useState(false);
  const anterior = useRef(unidades);

  // la pastilla "salta" cuando se agrega algo
  useEffect(() => {
    if (unidades > anterior.current) {
      setSalta(true);
      const t = setTimeout(() => setSalta(false), 600);
      anterior.current = unidades;
      return () => clearTimeout(t);
    }
    anterior.current = unidades;
  }, [unidades]);

  // si se vacía con la hoja abierta, se cierra
  useEffect(() => {
    if (!items.length && !quitado && dialogRef.current?.open)
      dialogRef.current.close();
  }, [items.length, quitado]);

  // "Pedir ahora" (desde el detalle de un producto) abre la hoja
  useEffect(() => {
    const abrirDesdeAfuera = () => {
      if (!dialogRef.current?.open) dialogRef.current?.showModal();
    };
    window.addEventListener(EVENTO_ABRIR, abrirDesdeAfuera);
    return () => window.removeEventListener(EVENTO_ABRIR, abrirDesdeAfuera);
  }, []);

  // "Deshacer" visible unos segundos después de quitar algo
  useEffect(() => {
    if (!quitado) return;
    const t = setTimeout(() => setQuitado(null), 5000);
    return () => clearTimeout(t);
  }, [quitado]);

  if (!items.length && !quitado) return null;

  const quitar = (x) => {
    const lugar = guardados.findIndex((g) => g.clave === x.clave);
    setQuitado({ item: guardados[lugar], lugar, nombre: x.nombre });
    cambiarCantidad(x.clave, 0);
  };
  const deshacer = () => {
    restaurar(quitado.item, quitado.lugar);
    setQuitado(null);
  };

  const abrir = () => dialogRef.current?.showModal();
  const cerrar = () => dialogRef.current?.close();
  const cambiar = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <>
      {items.length > 0 && (
        <button
          type="button"
          className={`pedido-pastilla ${salta ? "salta" : ""}`}
          onClick={abrir}
          aria-label={`Ver tu pedido: ${unidades} producto${unidades === 1 ? "" : "s"}`}
        >
          <span className="pedido-pastilla__cant">{unidades}</span>
          <span>Tu pedido</span>
          {total != null && (
            <span className="pedido-pastilla__total">
              {formatearPrecio(total)}
            </span>
          )}
          <Icon name="arrow" />
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="pedido"
        aria-labelledby={`${uid}-t`}
        onClick={(e) => e.target === e.currentTarget && cerrar()}
      >
        <div className="pedido__panel">
          <div className="pedido__cabecera">
            <h2 id={`${uid}-t`}>Tu pedido</h2>
            <button
              type="button"
              className="detalle__cerrar pedido__cerrar"
              onClick={cerrar}
            >
              <Icon name="close" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>

          <ul className="pedido__lista">
            {items.map((x) => (
              <li
                key={x.clave}
                className={`pedido__item ${x.estado !== "ok" ? "is-problema" : ""}`}
              >
                {x.foto ? (
                  <img src={x.foto} alt="" className="pedido__foto" />
                ) : (
                  <span className="pedido__foto" />
                )}
                <div className="pedido__info">
                  <p className="pedido__nombre">{x.nombre}</p>
                  {x.estado === "no-disponible" ? (
                    <p className="pedido__aviso">Ya no está disponible</p>
                  ) : x.opciones?.length > 1 || x.estado === "sin-tamano" ? (
                    <select
                      className="pedido__tamano"
                      aria-label={`Tamaño de ${x.nombre}`}
                      value={
                        x.estado === "sin-tamano" ? "" : (x.variante ?? "")
                      }
                      onChange={(e) =>
                        cambiarVariante(
                          x.clave,
                          x.opciones.find((o) => o.nombre === e.target.value),
                        )
                      }
                    >
                      {x.estado === "sin-tamano" && (
                        <option value="" disabled>
                          Elegí otro tamaño
                        </option>
                      )}
                      {x.opciones.map((o) => (
                        <option key={o.nombre} value={o.nombre}>
                          {o.nombre}
                          {o.precio != null
                            ? ` · ${formatearPrecio(o.precio)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    x.variante && (
                      <p className="pedido__variante">{x.variante}</p>
                    )
                  )}
                  {x.estado === "ok" && (
                    <p className="pedido__subtotal">
                      {x.precio != null
                        ? formatearPrecio(x.precio * x.cantidad)
                        : "Precio a confirmar"}
                    </p>
                  )}
                </div>
                <div className="pedido__cantidad">
                  <button
                    type="button"
                    aria-label={
                      x.cantidad === 1 || x.estado !== "ok"
                        ? `Quitar ${x.nombre}`
                        : `Uno menos de ${x.nombre}`
                    }
                    onClick={() =>
                      x.cantidad === 1 || x.estado !== "ok"
                        ? quitar(x)
                        : cambiarCantidad(x.clave, x.cantidad - 1)
                    }
                  >
                    {x.cantidad === 1 || x.estado !== "ok" ? (
                      <Icon name="trash" />
                    ) : (
                      "−"
                    )}
                  </button>
                  <span aria-live="polite">{x.cantidad}</span>
                  <button
                    type="button"
                    disabled={x.estado !== "ok" || x.cantidad >= 99}
                    aria-label={`Uno más de ${x.nombre}`}
                    onClick={() => cambiarCantidad(x.clave, x.cantidad + 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {quitado && (
            <p className="pedido__deshacer" role="status">
              Quitaste {quitado.nombre}.{" "}
              <button
                type="button"
                className="pedido__boton-texto"
                onClick={deshacer}
              >
                Deshacer
              </button>
            </p>
          )}
          {problemas > 0 && (
            <p className="pedido__aviso" role="status">
              {problemas === 1
                ? "Un producto necesita que lo revises: no se va a incluir en el mensaje."
                : `${problemas} productos necesitan que los revises: no se van a incluir en el mensaje.`}
            </p>
          )}

          <div className="pedido__datos">
            <div className="campo">
              <label htmlFor={`${uid}-fecha`}>¿Para cuándo?</label>
              <input
                id={`${uid}-fecha`}
                name="fecha"
                type="date"
                min={minimo}
                value={datos.fecha}
                onChange={cambiar}
                aria-describedby={`${uid}-fecha-aviso`}
              />
              {datos.fecha && datos.fecha < minimo && (
                <small id={`${uid}-fecha-aviso`} className="pedido__aviso">
                  Con menos de {DIAS_AVISO} días de aviso, consultanos
                  disponibilidad.
                </small>
              )}
            </div>
            <div className="campo">
              <label htmlFor={`${uid}-nombre`}>Tu nombre</label>
              <input
                id={`${uid}-nombre`}
                name="nombre"
                autoComplete="given-name"
                maxLength={80}
                value={datos.nombre}
                onChange={cambiar}
              />
            </div>
            <div className="campo pedido__nota">
              <label htmlFor={`${uid}-nota`}>
                Nota <small>(opcional)</small>
              </label>
              <input
                id={`${uid}-nota`}
                name="nota"
                maxLength={300}
                placeholder="Dedicatoria, alergias…"
                value={datos.nota}
                onChange={cambiar}
              />
            </div>
          </div>

          <p className="pedido__total">
            {total != null ? (
              <>
                Total estimado <strong>{formatearPrecio(total)}</strong>
              </>
            ) : subtotal > 0 ? (
              <>
                <span>
                  Subtotal estimado
                  <small> + {aConfirmar} a confirmar por WhatsApp</small>
                </span>
                <strong>{formatearPrecio(subtotal)}</strong>
              </>
            ) : (
              "Te pasamos el precio por WhatsApp"
            )}
          </p>

          {unidades > 0 ? (
            <a
              className="btn btn--rosa pedido__enviar"
              href={linkWhatsApp(mensajePedido(items, datos), negocio.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="whatsapp" /> Enviar pedido por WhatsApp
            </a>
          ) : (
            <p className="pedido__aviso">
              Agregá algún producto disponible para enviar el pedido.
            </p>
          )}
          <button
            type="button"
            className="pedido__boton-texto pedido__vaciar"
            onClick={() =>
              window.confirm("¿Vaciar el pedido?") && vaciarPedido()
            }
          >
            Vaciar pedido
          </button>
        </div>
      </dialog>
    </>
  );
}

export default PedidoFlotante;
