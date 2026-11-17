// Contraste de los colores de Amoma (src/index.css), MEDIDO con la fórmula de
// WCAG 2.x en cada cambio. AA pide 4.5 para texto normal y 3 para texto grande.
// Antes estaban medidos a mano en comentarios: si alguien cambiaba un color,
// nada avisaba. (Traído de San-F/web-plantilla, tests/tema.test.js.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luz = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * canal(n >> 16) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const css = readFileSync("src/index.css", "utf8");
const color = (nombre) => {
  const m = new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  assert.ok(m, `src/index.css: falta --${nombre} en formato #rrggbb`);
  return m[1];
};

test("la fórmula de contraste da los valores conocidos", () => {
  assert.equal(Math.round(contraste("#000000", "#ffffff")), 21);
  assert.ok(contraste("#777777", "#ffffff") < 4.5); // el gris que "casi" llega
});

const CLAROS = ["crema", "crema-2", "rosa-claro", "blanco"];
// [texto, fondo, mínimo]
const pares = [
  ...CLAROS.map((f) => ["cacao", f, 4.5]),
  ...CLAROS.map((f) => ["cacao-suave", f, 4.5]),
  ...CLAROS.map((f) => ["rosa-oscuro", f, 4.5]),
  ["blanco", "rosa-boton", 4.5], // botones
  ["crema", "cacao", 4.5], // secciones oscuras (cierre, cinta, pie)
  ["rosa-claro", "cacao", 4.5],
  ["rosa", "cacao", 4.5], // el rosa de marca, SOLO sobre cacao
  ["rosa-boton", "crema", 3], // título grande de la página 404
];
for (const [texto, fondo, minimo] of pares)
  test(`--${texto} sobre --${fondo} llega a ${minimo}`, () => {
    const c = contraste(color(texto), color(fondo));
    assert.ok(c >= minimo, `contraste ${c.toFixed(2)} (mínimo ${minimo})`);
  });

// --rosa da 2,96 sobre blanco: como color de texto solo va en secciones con
// fondo cacao. Usarlo en otro lado es una decisión que hay que medir antes.
test("el rosa de marca como texto solo aparece sobre fondo cacao", () => {
  const PERMITIDOS = [
    "src/styles/Footer.css .footer__datos .icon",
    "src/styles/Ribbon.css .cinta i",
    "src/styles/Hero.css .hero__corazon",
    "src/styles/Closing.css .cierre em",
    "src/styles/Closing.css .cierre__num",
  ];
  const usos = [];
  for (const dir of ["src/styles", "src/admin"])
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".css"))) {
      const texto = readFileSync(`${dir}/${f}`, "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );
      for (const m of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g))
        if (/(^|[;\s])color:\s*var\(--rosa\)/.test(m[2]))
          usos.push(`${dir}/${f} ${m[1].trim().replace(/\s+/g, " ")}`);
    }
  for (const u of usos)
    assert.ok(
      PERMITIDOS.includes(u),
      `${u}: --rosa como texto. Sobre fondo claro usar --rosa-oscuro`,
    );
  assert.ok(usos.length > 0, "no encontró ningún uso: la búsqueda no anda");
});
