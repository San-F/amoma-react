// Planilla de Excel: todo lo que puede hacer la dueña con ella (y lo que puede
// hacer mal). Se arma el .xlsx de verdad, se lo "edita" y se lo vuelve a leer
// igual que el panel (primera hoja), antes de mandarlo a la base.
import { test } from "node:test";
import assert from "node:assert/strict";
import readTodas, { readSheet } from "read-excel-file/universal";
import {
  ENCABEZADOS,
  filasModelo,
  interpretarPlanilla,
} from "../src/admin/lib/importer.js";
import { armarPlanilla } from "../src/admin/lib/planilla.js";

const CATEGORIAS = [
  { slug: "tortas", name: "Tortas" },
  { slug: "postres", name: "Tartas y postres" },
];

const CARGADO = [
  {
    code: 1,
    slug: "torta-de-frutos-rojos",
    name: "Torta de frutos rojos",
    short_description: "Bizcochuelo, dulce de leche y frutillas.",
    is_published: true,
    category: { name: "Tortas" },
    variants: [
      { label: "Chica", servings: 10, price_cents: 2800000 },
      { label: "Mediana", servings: 15, price_cents: 3900000 },
      { label: "Grande", servings: 25, price_cents: 5600000 },
    ],
  },
  {
    code: 2,
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
];

// arma el .xlsx (como "Descargar") y lo vuelve a leer (como "Elegir planilla")
const bajar = async (o) => readSheet(await armarPlanilla(o));
const leer = (filas) => interpretarPlanilla(filas, CATEGORIAS);
const COD = 7; // columna "Código (no tocar)"

test("catálogo: encabezados prolijos, código de número y precio como número", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  assert.deepEqual(filas[0], ENCABEZADOS);
  assert.equal(filas.length, 1 + 5, "una fila por tamaño");
  assert.deepEqual(filas[1], [
    "Torta de frutos rojos",
    "Tortas",
    "Bizcochuelo, dulce de leche y frutillas.",
    "Chica",
    10,
    28000,
    "sí",
    1,
  ]);
  // categoría, descripción y publicado van solo en la primera fila
  assert.deepEqual(filas[2].slice(0, 3), ["Torta de frutos rojos", null, null]);
});

test("catálogo: bajar y subir sin tocar nada deja todo igual", async () => {
  const { productos, errores } = leer(
    await bajar({ productos: CARGADO, categorias: CATEGORIAS }),
  );
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 2);
  const [torta, lemon] = productos;
  assert.equal(torta.code, 1);
  assert.equal(torta.is_published, true);
  assert.equal(torta.variants.length, 3);
  assert.equal(lemon.code, 2);
  assert.equal(lemon.short_description, 'Con "merengue"; y limón');
  assert.equal(lemon.category_slug, "postres");
  assert.equal(lemon.is_published, false, "lo oculto sigue oculto");
  assert.deepEqual(
    lemon.variants.map((v) => [v.label, v.servings, v.price_cents]),
    [
      ["Chica", 8, 1900000],
      ["Grande", null, 3000050],
    ],
  );
});

test("catálogo: la segunda hoja 'Cómo usar' explica y lista las categorías", async () => {
  const hojas = await readTodas(
    await armarPlanilla({ productos: CARGADO, categorias: CATEGORIAS }),
  );
  assert.deepEqual(
    hojas.map((h) => h.sheet),
    ["Catálogo", "Cómo usar"],
  );
  const texto = hojas[1].data.flat().filter(Boolean).join(" ");
  assert.match(texto, /Tartas y postres/);
  assert.match(texto, /no tocar|NO se borra|vacía/i);
});

test("cambiar TODOS los nombres: cada fila sigue unida a su producto por el código", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  for (const f of filas.slice(1)) f[0] = `Nuevo nombre ${f[COD]}`;
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.deepEqual(
    productos.map((p) => [p.code, p.name]),
    [
      [1, "Nuevo nombre 1"],
      [2, "Nuevo nombre 2"],
    ],
  );
});

test("cambiar precios con distintas formas de escribirlos", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas[1][5] = "$ 30.000";
  filas[2][5] = "41.500,50";
  filas[3][5] = 60000;
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.deepEqual(
    productos[0].variants.map((v) => v.price_cents),
    [3000000, 4150050, 6000000],
  );
});

test("borrar la fila de un tamaño: ese producto queda sin ese tamaño", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  const sinMediana = filas.filter((f) => f[3] !== "Mediana");
  const { productos } = leer(sinMediana);
  assert.deepEqual(
    productos[0].variants.map((v) => v.label),
    ["Chica", "Grande"],
  );
});

test("agregar un tamaño a un producto existente (fila con su código)", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas.push(["Lemon pie", null, null, "Mediana", 12, 25000, null, 2]);
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.deepEqual(
    productos[1].variants.map((v) => v.label),
    ["Chica", "Grande", "Mediana"],
  );
});

test("agregar una torta nueva: sin código, el panel la crea", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas.push([
    "Chocotorta",
    "Tortas",
    "La de siempre",
    "Grande",
    20,
    25000,
    "sí",
    null,
  ]);
  filas.push(["Chocotorta", null, null, "Chica", 10, 15000, null, null]);
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  const nueva = productos.find((p) => p.name === "Chocotorta");
  assert.equal(nueva.code, null);
  assert.equal(nueva.slug, "chocotorta");
  assert.equal(nueva.category_slug, "tortas");
  assert.equal(nueva.variants.length, 2);
});

test("errores: código tocado, tamaño repetido, nombre duplicado, categoría y precio", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas[1][COD] = "uno"; // fila 2: código cambiado a mano
  filas[5][3] = "Chica"; // fila 6: Lemon pie "Grande" pasa a "Chica" (repetido)
  filas.push([
    "Lemon pie",
    "Tartas y postres",
    null,
    "Única",
    null,
    9000,
    null,
    null,
  ]); // fila 7
  filas.push(["Budín", "Panadería", null, "Único", null, "caro", null, null]); // fila 8
  const { errores } = leer(filas);
  const tiene = (fila, texto) =>
    errores.some((e) => e.includes(`Fila ${fila}`) && e.includes(texto));
  assert.ok(tiene(2, "código"), errores.join("\n"));
  assert.ok(tiene(6, "repetido"), errores.join("\n"));
  assert.ok(
    tiene(7, "ya está en la planilla con el código 2"),
    errores.join("\n"),
  );
  assert.ok(tiene(8, "Panadería"), errores.join("\n"));
  assert.ok(tiene(8, "caro"), errores.join("\n"));
});

test("'publicado': sí / no / vacío (= como está)", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas[1][6] = "NO";
  filas[4][6] = null;
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.equal(productos[0].is_published, false);
  assert.equal(productos[1].is_published, null);
});

test("filas vacías en el medio o al final se ignoran", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  filas.splice(3, 0, [null, null, null, null, null, null, null, null]);
  filas.push([null, "", null, "", null, null, null, null]);
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 2);
});

test("columnas en otro orden o con una columna de más: se lee igual", async () => {
  const filas = await bajar({ productos: CARGADO, categorias: CATEGORIAS });
  const orden = [7, 5, 0, 3, 1, 2, 4, 6];
  const reordenadas = filas.map((f) => [...orden.map((i) => f[i]), "nota"]);
  reordenadas[0][8] = "Notas mías";
  const { productos, errores } = leer(reordenadas);
  assert.deepEqual(errores, []);
  assert.equal(productos[1].code, 2);
  assert.equal(productos[1].variants[1].price_cents, 3000050);
});

test("el código que Excel guarda como 2.0 se entiende como 2", () => {
  const { productos, errores } = leer([
    ENCABEZADOS,
    ["Lemon pie", null, null, "Chica", 8, 19000, null, "2.0"],
  ]);
  assert.deepEqual(errores, []);
  assert.equal(productos[0].code, 2);
});

test("planilla vacía: solo ejemplos en gris, que se ignoran al subirla", async () => {
  const filas = await bajar({ categorias: CATEGORIAS, vacia: true });
  assert.deepEqual(filas[0], ENCABEZADOS);
  assert.equal(filas.length, 1 + filasModelo().length);
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 0);
});

test("planilla vacía completada (con los ejemplos todavía): solo entra lo nuevo", async () => {
  const filas = await bajar({ categorias: CATEGORIAS, vacia: true });
  filas.push([
    "Chocotorta",
    "Tortas",
    "La de siempre",
    "Grande",
    20,
    25000,
    "sí",
    null,
  ]);
  const { productos, errores } = leer(filas);
  assert.deepEqual(errores, []);
  assert.equal(productos.length, 1);
  assert.equal(productos[0].variants[0].price_cents, 2500000);
});

test("un texto que empieza con '=' queda como texto (no se vuelve fórmula)", async () => {
  const raro = [{ ...CARGADO[0], name: "=SUMA(A1)", code: 9 }];
  const filas = await bajar({ productos: raro, categorias: CATEGORIAS });
  assert.equal(filas[1][0], "=SUMA(A1)");
});

test("un producto sin precios igual aparece en la planilla (y avisa al subirla)", async () => {
  const sinPrecio = [{ ...CARGADO[0], code: 5, variants: [] }];
  const filas = await bajar({ productos: sinPrecio, categorias: CATEGORIAS });
  assert.equal(filas.length, 2);
  const { errores } = leer(filas);
  assert.ok(errores.some((e) => e.includes("no tiene ningún precio")));
});
