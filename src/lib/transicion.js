import { flushSync } from "react-dom";

// Envuelve un cambio de pantalla en una View Transition del navegador.
// `tipo` agrega una clase a <html> mientras dura, para elegir la coreografía
// en CSS (ej. "vt-detalle": sin fundido de página, solo panel + foto).
// Si no hay soporte o la persona pidió menos movimiento, aplica el cambio directo.
export function conTransicion(cambio, tipo) {
  const menosMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!document.startViewTransition || menosMovimiento) {
    cambio();
    return null;
  }
  const html = document.documentElement;
  if (tipo) html.classList.add(tipo);
  const t = document.startViewTransition(() => flushSync(cambio));
  if (tipo) t.finished.finally(() => html.classList.remove(tipo));
  return t;
}
