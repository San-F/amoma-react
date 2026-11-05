// "Tu pedido": productos elegidos para mandar en UN solo mensaje de WhatsApp.
// Sin cuentas ni pagos. Se guarda en este navegador (si se puede) para que
// no se pierda al cerrar la página.
import { useSyncExternalStore } from "react";
import { formatearPrecio } from "./money.js";
import { fechaLegible } from "./fechas.js";

const CLAVE = "amoma-pedido";
const suscriptos = new Set();

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(datos)
      ? datos.filter((x) => x && x.clave && x.cantidad > 0)
      : [];
  } catch {
    return [];
  }
}

let items = leer();

function guardar(nuevos) {
  items = nuevos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // sin almacenamiento (modo privado): funciona igual mientras la página esté abierta
  }
  suscriptos.forEach((fn) => fn());
}

// opciones: tamaños posibles del producto [{ nombre, precio }] (para poder cambiarlo después)
export function agregarAlPedido({
  id,
  nombre,
  variante,
  precio,
  foto,
  opciones,
}) {
  const clave = `${id}::${variante ?? ""}`;
  const existe = items.find((x) => x.clave === clave);
  guardar(
    existe
      ? items.map((x) =>
          x.clave === clave
            ? { ...x, cantidad: Math.min(x.cantidad + 1, 99) }
            : x,
        )
      : [
          ...items,
          {
            clave,
            id,
            nombre,
            variante: variante ?? null,
            precio: precio ?? null,
            foto: foto ?? null,
            opciones: opciones ?? [],
            cantidad: 1,
          },
        ],
  );
}

export function cambiarCantidad(clave, cantidad) {
  guardar(
    cantidad <= 0
      ? items.filter((x) => x.clave !== clave)
      : items.map((x) =>
          x.clave === clave ? { ...x, cantidad: Math.min(cantidad, 99) } : x,
        ),
  );
}

// Cambiar el tamaño de un producto ya agregado. Si ese tamaño ya estaba en el
// pedido, se suman las cantidades en una sola línea.
export function cambiarVariante(clave, opcion) {
  const item = items.find((x) => x.clave === clave);
  if (!item) return;
  const nuevaClave = `${item.id}::${opcion.nombre}`;
  if (nuevaClave === clave) return;
  const otro = items.find((x) => x.clave === nuevaClave);
  guardar(
    otro
      ? items
          .filter((x) => x.clave !== clave)
          .map((x) =>
            x.clave === nuevaClave
              ? { ...x, cantidad: Math.min(x.cantidad + item.cantidad, 99) }
              : x,
          )
      : items.map((x) =>
          x.clave === clave
            ? {
                ...x,
                clave: nuevaClave,
                variante: opcion.nombre,
                precio: opcion.precio ?? null,
              }
            : x,
        ),
  );
}

export const vaciarPedido = () => guardar([]);

export function usePedido() {
  return useSyncExternalStore(
    (fn) => {
      suscriptos.add(fn);
      return () => suscriptos.delete(fn);
    },
    () => items,
  );
}

// Totales: solo si TODOS los productos tienen precio (si no, "a confirmar")
export function resumenPedido(lista) {
  const unidades = lista.reduce((s, x) => s + x.cantidad, 0);
  const conPrecio = lista.length > 0 && lista.every((x) => x.precio != null);
  const total = conPrecio
    ? lista.reduce((s, x) => s + x.precio * x.cantidad, 0)
    : null;
  return { unidades, total };
}

export function mensajePedido(lista, { fecha, nombre, nota } = {}) {
  const { total } = resumenPedido(lista);
  const lineas = lista.map(
    (x) =>
      `• ${x.cantidad} × ${x.nombre}${x.variante ? ` (${x.variante})` : ""}${
        x.precio != null ? ` — ${formatearPrecio(x.precio * x.cantidad)}` : ""
      }`,
  );
  return [
    `¡Hola Amoma!${nombre?.trim() ? ` Soy ${nombre.trim()}.` : ""} Quiero hacer este pedido:`,
    "",
    ...lineas,
    "",
    total != null
      ? `Total estimado: ${formatearPrecio(total)}`
      : "Precio: a confirmar",
    fecha ? `Para el ${fechaLegible(fecha)}.` : "",
    nota?.trim() ? `Nota: ${nota.trim()}` : "",
    "",
    "¿Me confirman disponibilidad? ¡Gracias!",
  ]
    .filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== a.length - 1))
    .join("\n");
}
