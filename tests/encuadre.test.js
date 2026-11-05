import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aFila,
  desdeFila,
  estiloEncuadre,
  mover,
  normalizar,
} from "../src/lib/encuadre.js";

test("valores fuera de rango o basura quedan dentro de los límites", () => {
  assert.deepEqual(normalizar({ x: 150, y: -20, zoom: 9 }), {
    x: 100,
    y: 0,
    zoom: 3,
  });
  assert.deepEqual(normalizar({ x: "hola", zoom: 0.2 }), {
    x: 50,
    y: 50,
    zoom: 1,
  });
  assert.deepEqual(normalizar(null), { x: 50, y: 50, zoom: 1 });
});

test("centrado y sin zoom no cambia nada en la página", () => {
  assert.equal(estiloEncuadre({ x: 50, y: 50, zoom: 1 }), undefined);
  assert.equal(estiloEncuadre(undefined), undefined);
});

test("el estilo usa el mismo punto para mover y acercar", () => {
  assert.deepEqual(estiloEncuadre({ x: 30, y: 80, zoom: 1.5 }), {
    objectPosition: "30% 80%",
    transform: "scale(1.5)",
    transformOrigin: "30% 80%",
  });
});

test("arrastrar mueve en sentido contrario y respeta los bordes", () => {
  const e = mover({ x: 50, y: 50, zoom: 1 }, 50, -50, 200);
  assert.equal(e.x, 25);
  assert.equal(e.y, 75);
  // con zoom el mismo arrastre mueve menos (más precisión)
  assert.equal(mover({ x: 50, y: 50, zoom: 2 }, 50, 0, 200).x, 37.5);
  // no se sale de la foto
  assert.equal(mover({ x: 5, y: 50, zoom: 1 }, 500, 0, 200).x, 0);
});

test("ida y vuelta con la base", () => {
  assert.deepEqual(desdeFila(aFila({ x: 33.333, y: 70, zoom: 1.256 })), {
    x: 33.33,
    y: 70,
    zoom: 1.26,
  });
  assert.deepEqual(desdeFila({}), { x: 50, y: 50, zoom: 1 });
});
