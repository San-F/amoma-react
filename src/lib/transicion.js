import { flushSync } from "react-dom";

// Envuelve un cambio de pantalla en una View Transition del navegador
// (la foto "viaja", el contenido se funde). Si no hay soporte o la persona
// pidió menos movimiento, aplica el cambio directo.
export function conTransicion(cambio) {
  const menosMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!document.startViewTransition || menosMovimiento) {
    cambio();
    return null;
  }
  return document.startViewTransition(() => flushSync(cambio));
}
