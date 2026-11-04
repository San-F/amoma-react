// La plata se guarda en centavos (entero) para evitar errores de redondeo.

const formato = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPrecio(centavos) {
  if (centavos == null) return "";
  return formato.format(Math.round(centavos) / 100);
}

// Acepta lo que escribe una persona en Argentina o lo que trae Excel:
// 18000 · "18.000" · "$ 18.000" · "18.000,50" · "18000.5"
// Devuelve centavos (entero) o null si no se puede interpretar.
export function pesosACentavos(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.round(valor * 100) : null;
  }
  let t = String(valor).replace(/[$\s]/g, "").replace(/ars/i, "");
  if (t === "") return null;
  if (t.includes(",")) {
    // formato argentino: punto = miles, coma = decimales
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "18.000" o "1.250.000": puntos de miles
    t = t.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}
