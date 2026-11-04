import { test } from "node:test";
import assert from "node:assert/strict";
import {
  interpretarPlanilla,
  parsearCSV,
  plantillaCSV,
  claveFoto,
} from "../src/admin/lib/importer.js";

const CATEGORIAS = [
  { slug: "tortas", name: "Tortas" },
  { slug: "postres", name: "Tartas y postres" },
];

test("la planilla modelo se lee sin errores", () => {
  const { productos, errores } = interpretarPlanilla(
    parsearCSV(plantillaCSV()),
    CATEGORIAS,
  );
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 2);
  const lemon = productos.find((p) => p.slug === "lemon-pie");
  assert.equal(lemon.category_slug, "postres");
  assert.equal(lemon.variants.length, 2);
  assert.equal(lemon.variants[1].price_cents, 3200000);
  assert.equal(lemon.foto, "lemon-pie.jpg");
  assert.equal(lemon.is_published, true);
});

test("encabezados con mayúsculas, tildes y sinónimos", () => {
  const filas = [
    ["Producto", "Categoría", "Tamaño", "Precio", "Imagen", "Visible"],
    ["Chocotorta", "tortas", "Grande", "$ 25.000", "IMG_123.JPG", "no"],
  ];
  const { productos, errores } = interpretarPlanilla(filas, CATEGORIAS);
  assert.deepEqual(errores, []);
  assert.equal(productos[0].variants[0].price_cents, 2500000);
  assert.equal(productos[0].is_published, false);
  assert.equal(claveFoto(productos[0].foto), "img_123");
});

test("errores claros con número de fila", () => {
  const filas = [
    ["nombre", "categoria", "precio", "porciones", "publicado"],
    ["", "tortas", "100", "", ""],
    ["Torta X", "Panadería", "100", "", ""],
    ["Torta Y", "tortas", "caro", "", ""],
    ["Torta Z", "tortas", "100", "muchas", "quizás"],
  ];
  const { errores } = interpretarPlanilla(filas, CATEGORIAS);
  assert.ok(errores.some((e) => e.startsWith("Fila 2: falta el nombre")));
  assert.ok(
    errores.some((e) => e.includes("Fila 3") && e.includes("Panadería")),
  );
  assert.ok(errores.some((e) => e.includes("Fila 4") && e.includes("caro")));
  assert.ok(
    errores.some((e) => e.includes("Fila 5") && e.includes("porciones")),
  );
  assert.ok(
    errores.some((e) => e.includes("Fila 5") && e.includes("publicado")),
  );
  assert.ok(
    errores.some((e) => e.includes('"Torta Y": no tiene ningún precio')),
  );
});

test("falta la columna precio", () => {
  const { errores } = interpretarPlanilla([["nombre"], ["Algo"]], CATEGORIAS);
  assert.match(errores[0], /precio/);
});

test("CSV con comas, comillas y saltos de línea dentro de una celda", () => {
  const filas = parsearCSV(
    'nombre,descripcion,precio\n"Torta, rica","Dice ""hola""\ny chau",100\n',
  );
  assert.deepEqual(filas[1], ["Torta, rica", 'Dice "hola"\ny chau', "100"]);
});

test("filas vacías se ignoran", () => {
  const { productos, errores } = interpretarPlanilla(
    [
      ["nombre", "precio"],
      ["", ""],
      ["Tarta", "100"],
      [null, null],
    ],
    CATEGORIAS,
  );
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 1);
});
