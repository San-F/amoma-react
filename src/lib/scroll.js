// Desplazamiento suave con aceleración y frenado (más fino que el del
// navegador). Con "reducir movimiento" salta directo.
const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let animacion = 0;

export function irA(destino, { margen = 16 } = {}) {
  const el =
    typeof destino === "string" ? document.querySelector(destino) : destino;
  if (!el) return;
  const desde = window.scrollY;
  const hasta = Math.max(0, el.getBoundingClientRect().top + desde - margen);
  const distancia = hasta - desde;
  if (Math.abs(distancia) < 2) return;

  cancelAnimationFrame(animacion);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, hasta);
    return;
  }
  // más lejos = un poco más largo, con tope para que nunca se haga lento
  const duracion = Math.min(1300, 550 + Math.abs(distancia) * 0.35);
  const inicio = performance.now();
  // si la persona toca o usa la rueda, se cancela (nunca "pelear" con el usuario)
  const cancelar = () => cancelAnimationFrame(animacion);
  window.addEventListener("wheel", cancelar, { once: true, passive: true });
  window.addEventListener("touchstart", cancelar, {
    once: true,
    passive: true,
  });

  const paso = (ahora) => {
    const t = Math.min(1, (ahora - inicio) / duracion);
    window.scrollTo(0, desde + distancia * suavizar(t));
    if (t < 1) animacion = requestAnimationFrame(paso);
    else {
      window.removeEventListener("wheel", cancelar);
      window.removeEventListener("touchstart", cancelar);
    }
  };
  animacion = requestAnimationFrame(paso);
}
