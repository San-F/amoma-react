// Supabase devuelve el QR como "data:image/svg+xml;utf-8,<svg …>" sin codificar.
// Si el SVG trae un "#" (colores como #fff) el navegador corta la URL ahí y la
// imagen no carga. Lo re-codificamos para que se vea siempre.
export function qrSeguro(qr) {
  if (typeof qr !== "string") return "";
  const m = qr.match(/^data:image\/svg\+xml;(?:charset=)?utf-?8,(.*)$/is);
  if (!m) return qr;
  const svg = m[1].trim().startsWith("<") ? m[1] : decodeURIComponent(m[1]);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
