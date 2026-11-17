import { test } from "node:test";
import assert from "node:assert/strict";
import { pesosACentavos, formatearPrecio } from "../src/lib/money.js";
import { slugify } from "../src/lib/slug.js";

test("pesosACentavos entiende formatos argentinos y de Excel", () => {
  assert.equal(pesosACentavos(18000), 1800000);
  assert.equal(pesosACentavos("18000"), 1800000);
  assert.equal(pesosACentavos("18.000"), 1800000);
  assert.equal(pesosACentavos("$ 18.000"), 1800000);
  assert.equal(pesosACentavos("1.250.000"), 125000000);
  assert.equal(pesosACentavos("18.000,50"), 1800050);
  assert.equal(pesosACentavos("18000.5"), 1800050);
  assert.equal(pesosACentavos(""), null);
  assert.equal(pesosACentavos("gratis"), null);
  assert.equal(pesosACentavos("-500"), null);
});

test("pesosACentavos siempre devuelve centavos ENTEROS (nunca fracciones)", () => {
  // números con más de dos decimales, como los que deja una fórmula de Excel
  for (const valor of [19.999, 0.1 + 0.2, 1234.5678, 33.333333]) {
    const c = pesosACentavos(valor);
    assert.equal(Number.isInteger(c), true, `${valor} → ${c}`);
  }
  assert.equal(pesosACentavos(19.999), 2000);
  assert.equal(pesosACentavos(0.1 + 0.2), 30);
});

test("formatearPrecio muestra pesos sin decimales", () => {
  assert.match(formatearPrecio(1800000), /18\.000/);
});

test("slugify", () => {
  assert.equal(slugify("Torta de Frutos Rojos!"), "torta-de-frutos-rojos");
  assert.equal(slugify("  Lemon   pie "), "lemon-pie");
  assert.equal(slugify("Ñoquis & Crème brûlée"), "noquis-creme-brulee");
});
