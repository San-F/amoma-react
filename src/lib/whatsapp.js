import { negocio } from "../data/catalog";

// Arma un link de WhatsApp con el mensaje ya escrito.
// `numero` viene de los ajustes cargados por la dueña (useSitio); si no, el fijo.
export function linkWhatsApp(mensaje, numero = negocio.whatsapp) {
  const texto = encodeURIComponent(mensaje.trim());
  return `https://wa.me/${numero}?text=${texto}`;
}

// "2026-11-20" → "viernes 20 de noviembre"
export function fechaLegible(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Fecha mínima para encargar (hoy + días de anticipación), formato input date.
export function fechaMinima(diasAnticipacion = 2) {
  const d = new Date();
  d.setDate(d.getDate() + diasAnticipacion);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
