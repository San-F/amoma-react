// Encuadre de una foto dentro de su círculo (o recuadro): qué punto queda al
// centro (x, y en %) y cuánto se acerca (zoom). Lo usan la página y el panel,
// así lo que la dueña ve al acomodar la foto es exactamente lo que se publica.

export const ZOOM_MAX = 3;
export const CENTRADO = { x: 50, y: 50, zoom: 1 };

const entre = (n, min, max, porDefecto) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : porDefecto;
};
const redondear = (n, dec) => Math.round(n * 10 ** dec) / 10 ** dec;

export function normalizar(enc) {
  return {
    x: redondear(entre(enc?.x, 0, 100, 50), 2),
    y: redondear(entre(enc?.y, 0, 100, 50), 2),
    zoom: redondear(entre(enc?.zoom, 1, ZOOM_MAX, 1), 2),
  };
}

// Estilo para la <img> (que ya tiene object-fit: cover).
// Sin encuadre (o centrado) no agrega nada.
export function estiloEncuadre(enc) {
  if (!enc) return undefined;
  const { x, y, zoom } = normalizar(enc);
  if (x === 50 && y === 50 && zoom === 1) return undefined;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  };
}

// Arrastrar la foto: dx/dy en píxeles, `caja` = tamaño del círculo en píxeles.
// Mover la foto a la derecha deja ver más de su lado izquierdo (x baja).
export function mover(enc, dx, dy, caja) {
  const e = normalizar(enc);
  const paso = 100 / (caja * e.zoom);
  return normalizar({ ...e, x: e.x - dx * paso, y: e.y - dy * paso });
}

// Fila de la base (focus_x, focus_y, zoom) ⇄ encuadre
export const desdeFila = (f) =>
  normalizar({ x: f?.focus_x, y: f?.focus_y, zoom: f?.zoom });
export const aFila = (enc) => {
  const { x, y, zoom } = normalizar(enc);
  return { focus_x: x, focus_y: y, zoom };
};
