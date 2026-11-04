// Convierte un teléfono argentino como lo escribe la gente al formato que
// necesita wa.me: "11 5555-1234" → "5491155551234".
export function aWhatsApp(telefono) {
  let d = String(telefono ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return "549" + d.slice(2);
  if (d.startsWith("0")) d = d.slice(1); // 011 …
  // "11 15 5555 1234": el 15 después del código de área se saca
  if (d.length === 12 && d.startsWith("15", 2)) d = d.slice(0, 2) + d.slice(4);
  if (d.length === 10) return "549" + d;
  return d;
}
