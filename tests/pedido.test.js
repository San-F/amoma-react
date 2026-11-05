import { test } from "node:test";
import assert from "node:assert/strict";
import { mensajePedido, resumenPedido } from "../src/lib/pedido.js";

const lista = [
  {
    clave: "a",
    nombre: "Torta de frutos rojos",
    variante: "Mediana",
    precio: 3600000,
    cantidad: 1,
  },
  {
    clave: "b",
    nombre: "Chipá",
    variante: "Docena",
    precio: 800000,
    cantidad: 2,
  },
];

test("total y unidades del pedido", () => {
  assert.deepEqual(resumenPedido(lista), { unidades: 3, total: 5200000 });
});

test("si algún producto no tiene precio, el total queda a confirmar", () => {
  const r = resumenPedido([
    ...lista,
    { clave: "c", nombre: "Charlotte", precio: null, cantidad: 1 },
  ]);
  assert.equal(r.total, null);
});

test("el mensaje de WhatsApp lista todo, con total, fecha y nota", () => {
  const m = mensajePedido(lista, {
    fecha: "2026-12-12",
    nombre: "Ana",
    nota: "Sin nueces",
  });
  assert.match(m, /Soy Ana/);
  assert.match(m, /1 × Torta de frutos rojos \(Mediana\) — \$\s?36\.000/);
  assert.match(m, /2 × Chipá \(Docena\) — \$\s?16\.000/);
  assert.match(m, /Total estimado: \$\s?52\.000/);
  assert.match(m, /Para el sábado,? 12 de diciembre/);
  assert.match(m, /Nota: Sin nueces/);
});

test("cambiar el tamaño de un producto (y juntar si queda repetido)", async () => {
  const globalStore = {};
  globalThis.localStorage = {
    getItem: (k) => globalStore[k] ?? null,
    setItem: (k, v) => (globalStore[k] = v),
  };
  const m = await import("../src/lib/pedido.js?cambio");
  const opciones = [
    { nombre: "Chica", precio: 2600000 },
    { nombre: "Grande", precio: 5400000 },
  ];
  m.agregarAlPedido({
    id: "t",
    nombre: "Torta",
    variante: "Chica",
    precio: 2600000,
    opciones,
  });
  m.agregarAlPedido({
    id: "t",
    nombre: "Torta",
    variante: "Grande",
    precio: 5400000,
    opciones,
  });
  m.cambiarVariante("t::Chica", opciones[1]);
  const guardado = JSON.parse(globalStore["amoma-pedido"]);
  assert.equal(guardado.length, 1);
  assert.equal(guardado[0].variante, "Grande");
  assert.equal(guardado[0].cantidad, 2);
  assert.equal(guardado[0].precio, 5400000);
});
