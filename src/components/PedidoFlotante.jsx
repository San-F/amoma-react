import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import {
  cambiarCantidad,
  cambiarVariante,
  mensajePedido,
  resumenPedido,
  usePedido,
  vaciarPedido,
} from "../lib/pedido";
import { formatearPrecio } from "../lib/money";
import { fechaMinima, linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import "../styles/Pedido.css";

// Pastilla "Tu pedido" + hoja para revisar y mandar todo en un solo WhatsApp.
function PedidoFlotante() {
  const uid = useId();
  const items = usePedido();
  const { negocio } = useSitio();
  const { unidades, total } = resumenPedido(items);
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
    if (!items.length && dialogRef.current?.open) dialogRef.current.close();
  }, [items.length]);

  if (!items.length) return null;

  const abrir = () => dialogRef.current?.showModal();
  const cerrar = () => dialogRef.current?.close();
  const cambiar = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <>
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
              <li key={x.clave} className="pedido__item">
                {x.foto ? (
                  <img src={x.foto} alt="" className="pedido__foto" />
                ) : (
                  <span className="pedido__foto" />
                )}
                <div className="pedido__info">
                  <p className="pedido__nombre">{x.nombre}</p>
                  {x.opciones?.length > 1 ? (
                    <select
                      className="pedido__tamano"
                      aria-label={`Tamaño de ${x.nombre}`}
                      value={x.variante ?? ""}
                      onChange={(e) =>
                        cambiarVariante(
                          x.clave,
                          x.opciones.find((o) => o.nombre === e.target.value),
                        )
                      }
                    >
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
                </div>
                <div className="pedido__cantidad">
                  <button
                    type="button"
                    aria-label={
                      x.cantidad === 1
                        ? `Quitar ${x.nombre}`
                        : `Uno menos de ${x.nombre}`
                    }
                    onClick={() => cambiarCantidad(x.clave, x.cantidad - 1)}
                  >
                    {x.cantidad === 1 ? "×" : "−"}
                  </button>
                  <span aria-live="polite">{x.cantidad}</span>
                  <button
                    type="button"
                    aria-label={`Uno más de ${x.nombre}`}
                    onClick={() => cambiarCantidad(x.clave, x.cantidad + 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="pedido__datos">
            <div className="campo">
              <label htmlFor={`${uid}-fecha`}>¿Para cuándo?</label>
              <input
                id={`${uid}-fecha`}
                name="fecha"
                type="date"
                min={fechaMinima(2)}
                value={datos.fecha}
                onChange={cambiar}
              />
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
            ) : (
              "Te pasamos el precio por WhatsApp"
            )}
          </p>

          <a
            className="btn btn--rosa pedido__enviar"
            href={linkWhatsApp(mensajePedido(items, datos), negocio.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" /> Enviar pedido por WhatsApp
          </a>
          <button
            type="button"
            className="adm-link pedido__vaciar"
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
