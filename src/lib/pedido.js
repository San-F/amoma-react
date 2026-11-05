// "Tu pedido": productos elegidos para mandar en UN solo mensaje de WhatsApp.
// Sin cuentas ni pagos. Se guarda en este navegador (si se puede) para que
// no se pierda al cerrar la página. Lo guardado es solo "qué y cuánto": el
// nombre y el precio se toman SIEMPRE del catálogo actual (ver conCatalogo),
// así un precio viejo o un producto que ya no está no llegan al mensaje.
import { useSyncExternalStore } from "react";
import { formatearPrecio } from "./money.js";
import { fechaLegible } from "./fechas.js";

const CLAVE = "amoma-pedido";
const MAX = 99;
const suscriptos = new Set();

const claveDe = (id, variante) => `${id}::${variante ?? ""}`;
const limitar = (n) => Math.min(Math.max(Math.floor(Number(n) || 0), 0), MAX);

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    if (!Array.isArray(datos)) return [];
    const vistos = new Set();
    return datos
      .filter((x) => x && typeof x.id === "string")
      .map((x) => ({
        ...x,
        variante: x.variante ?? null,
        clave: claveDe(x.id, x.variante),
        cantidad: limitar(x.cantidad),
      }))
      .filter(
        (x) => x.cantidad > 0 && !vistos.has(x.clave) && vistos.add(x.clave),
      );
  } catch {
    return [];
  }
}

let items = leer();

function avisar() {
  suscriptos.forEach((fn) => fn());
}

function guardar(nuevos) {
  items = nuevos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // sin almacenamiento (modo privado): funciona igual mientras la página esté abierta
  }
  avisar();
}

// si se cambia el pedido en otra pestaña, esta se actualiza
function alCambiarOtraPestana(e) {
  if (e.key === CLAVE) {
    items = leer();
    avisar();
  }
}

// opciones: tamaños posibles del producto [{ nombre, precio }] (para poder cambiarlo después)
export function agregarAlPedido({
  id,
  nombre,
  variante,
  precio,
  foto,
  opciones,
  cantidad = 1,
}) {
  const clave = claveDe(id, variante);
  const suma = Math.max(limitar(cantidad), 1);
  if (items.some((x) => x.clave === clave)) {
    guardar(
      items.map((x) =>
        x.clave === clave ? { ...x, cantidad: limitar(x.cantidad + suma) } : x,
      ),
    );
    return;
  }
  const nuevo = {
    clave,
    id,
    nombre,
    variante: variante ?? null,
    precio: precio ?? null,
    foto: foto ?? null,
    opciones: opciones ?? [],
    cantidad: suma,
  };
  // el mismo producto en otro tamaño queda al lado (ej. torta chica y grande)
  const ultimo = items.findLastIndex((x) => x.id === id);
  guardar(
    ultimo === -1
      ? [...items, nuevo]
      : [...items.slice(0, ultimo + 1), nuevo, ...items.slice(ultimo + 1)],
  );
}

export function cambiarCantidad(clave, cantidad) {
  const n = limitar(cantidad);
  guardar(
    n === 0
      ? items.filter((x) => x.clave !== clave)
      : items.map((x) => (x.clave === clave ? { ...x, cantidad: n } : x)),
  );
}

// vuelve a poner un producto quitado, en el mismo lugar ("Deshacer")
export function restaurar(item, lugar) {
  if (items.some((x) => x.clave === item.clave)) return;
  const i = Math.min(Math.max(lugar, 0), items.length);
  guardar([...items.slice(0, i), item, ...items.slice(i)]);
}

// Cambiar el tamaño de un producto ya agregado. Si ese tamaño ya estaba en el
// pedido, se suman las cantidades en una sola línea.
export function cambiarVariante(clave, opcion) {
  const item = items.find((x) => x.clave === clave);
  if (!item || !opcion) return;
  const nuevaClave = claveDe(item.id, opcion.nombre);
  if (nuevaClave === clave) return;
  const otro = items.find((x) => x.clave === nuevaClave);
  guardar(
    otro
      ? items
          .filter((x) => x.clave !== clave)
          .map((x) =>
            x.clave === nuevaClave
              ? { ...x, cantidad: limitar(x.cantidad + item.cantidad) }
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

// "Pedir ahora" desde el detalle de un producto: abre la hoja del pedido
export const EVENTO_ABRIR = "amoma:abrir-pedido";
export const abrirHojaPedido = () =>
  window.dispatchEvent(new Event(EVENTO_ABRIR));

export function usePedido() {
  return useSyncExternalStore(
    (fn) => {
      if (!suscriptos.size && typeof window !== "undefined")
        window.addEventListener("storage", alCambiarOtraPestana);
      suscriptos.add(fn);
      return () => {
        suscriptos.delete(fn);
        if (!suscriptos.size && typeof window !== "undefined")
          window.removeEventListener("storage", alCambiarOtraPestana);
      };
    },
    () => items,
  );
}

// Tamaños de un producto: los que cargó la dueña o, si no cargó, los genéricos.
export function opcionesDe(producto, genericos = []) {
  return producto?.variantes?.length
    ? producto.variantes.map((v) => ({
        nombre: v.nombre,
        precio: v.precio ?? null,
      }))
    : genericos.map((t) => ({ nombre: t.nombre, precio: t.precio ?? null }));
}

// Junta lo guardado con el catálogo actual: nombre, precio y tamaños al día.
// estado: "ok" · "sin-tamano" (ese tamaño ya no existe) · "no-disponible".
// Si el catálogo todavía está cargando (definitivo = false), no se marca nada
// como "no disponible" para no asustar mientras llega la base.
export function conCatalogo(
  lista,
  productos,
  { genericos, definitivo = true } = {},
) {
  return lista.map((x) => {
    const p = productos.find((q) => q.id === x.id);
    if (!p) return { ...x, estado: definitivo ? "no-disponible" : "ok" };
    const opciones = opcionesDe(p, genericos);
    const opcion = opciones.find((o) => o.nombre === x.variante);
    return {
      ...x,
      nombre: p.nombre,
      opciones,
      precio: opcion ? opcion.precio : null,
      estado: opcion ? "ok" : "sin-tamano",
    };
  });
}

const valeEnElPedido = (x) => (x.estado ?? "ok") === "ok";

// Totales de lo que sí se puede pedir. aConfirmar = productos sin precio cargado.
export function resumenPedido(lista) {
  const validos = lista.filter(valeEnElPedido);
  const unidades = validos.reduce((s, x) => s + x.cantidad, 0);
  const conPrecio = validos.filter((x) => x.precio != null);
  const subtotal = conPrecio.reduce((s, x) => s + x.precio * x.cantidad, 0);
  const aConfirmar = validos.length - conPrecio.length;
  return {
    unidades,
    subtotal,
    aConfirmar,
    // total solo si TODO tiene precio
    total: validos.length && !aConfirmar ? subtotal : null,
    problemas: lista.length - validos.length,
  };
}

export function mensajePedido(lista, { fecha, nombre, nota } = {}) {
  const validos = lista.filter(valeEnElPedido);
  const { total, subtotal, aConfirmar } = resumenPedido(validos);
  const lineas = validos.map(
    (x) =>
      `• ${x.cantidad} × ${x.nombre}${x.variante ? ` (${x.variante})` : ""}${
        x.precio != null
          ? ` — ${formatearPrecio(x.precio * x.cantidad)}`
          : " — precio a confirmar"
      }`,
  );
  const totalTexto =
    total != null
      ? `Total estimado: ${formatearPrecio(total)}`
      : subtotal > 0
        ? `Subtotal estimado: ${formatearPrecio(subtotal)} + ${aConfirmar} a confirmar`
        : "Precio: a confirmar";
  return [
    `¡Hola Amoma!${nombre?.trim() ? ` Soy ${nombre.trim()}.` : ""} Quiero hacer este pedido:`,
    "",
    ...lineas,
    "",
    totalTexto,
    fecha ? `Para el ${fechaLegible(fecha)}.` : "",
    nota?.trim() ? `Nota: ${nota.trim()}` : "",
    "",
    "¿Me confirman disponibilidad? ¡Gracias!",
  ]
    .filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== a.length - 1))
    .join("\n");
}
