import { test } from "node:test";
import assert from "node:assert/strict";
import {
  interpretarPlanilla,
  parsearCSV,
  plantillaCSV,
  catalogoCSV,
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
  assert.equal(lemon.is_published, true);
});

test("sin 'publicado', no se decide nada (lo oculto sigue oculto)", () => {
  const { productos } = interpretarPlanilla(
    [
      ["nombre", "precio", "publicado"],
      ["Torta A", "100", ""],
    ],
    CATEGORIAS,
  );
  assert.equal(productos[0].is_published, null);
});

test("el catálogo descargado se vuelve a leer igual (ida y vuelta)", () => {
  const cargado = [
    {
      slug: "lemon-pie",
      name: "Lemon pie",
      short_description: 'Con "merengue"; y limón',
      is_published: false,
      category: { name: "Tartas y postres" },
      variants: [
        { label: "Chica", servings: 8, price_cents: 1900000 },
        { label: "Grande", servings: null, price_cents: 3000050 },
      ],
    },
    {
      slug: "sin-precio",
      name: "=SUMA(A1)",
      short_description: null,
      is_published: true,
      category: null,
      variants: [],
    },
  ];
  const csv = catalogoCSV(cargado);
  assert.ok(csv.includes("'=SUMA(A1)"), "las fórmulas se guardan como texto");
  const { productos, errores } = interpretarPlanilla(
    parsearCSV(csv),
    CATEGORIAS,
  );
  // el que no tiene precio se avisa; el resto vuelve idéntico
  assert.equal(errores.length, 1);
  const lemon = productos.find((p) => p.slug === "lemon-pie");
  assert.equal(lemon.short_description, 'Con "merengue"; y limón');
  assert.equal(lemon.category_slug, "postres");
  assert.equal(lemon.is_published, false);
  assert.deepEqual(
    lemon.variants.map((v) => [v.label, v.servings, v.price_cents]),
    [
      ["Chica", 8, 1900000],
      ["Grande", null, 3000050],
    ],
  );
  assert.equal(
    productos.find((p) => p.slug === "sin-precio").name,
    "=SUMA(A1)",
  );
});

test("con 'codigo', cambiar el nombre no crea un duplicado", () => {
  const { productos, errores } = interpretarPlanilla(
    [
      ["nombre", "tamaño", "precio", "codigo"],
      ["Lemon pie de la abuela", "Chica", "100", "lemon-pie"],
      ["Lemon pie de la abuela", "Grande", "200", "lemon-pie"],
    ],
    CATEGORIAS,
  );
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 1);
  assert.equal(productos[0].slug, "lemon-pie");
  assert.equal(productos[0].name, "Lemon pie de la abuela");
  assert.equal(productos[0].variants.length, 2);
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
