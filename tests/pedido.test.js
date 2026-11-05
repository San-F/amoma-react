import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conCatalogo,
  mensajePedido,
  opcionesDe,
  resumenPedido,
} from "../src/lib/pedido.js";

// Cada test usa un "navegador" nuevo (almacenamiento vacío y módulo recién cargado)
let n = 0;
async function nuevoPedido(inicial) {
  const guardado = {};
  if (inicial !== undefined) guardado["amoma-pedido"] = inicial;
  globalThis.localStorage = {
    getItem: (k) => guardado[k] ?? null,
    setItem: (k, v) => (guardado[k] = v),
  };
  const modulo = await import(`../src/lib/pedido.js?t=${n++}`);
  // lectura del estado actual a través del almacenamiento
  return {
    ...modulo,
    leerGuardado: () => JSON.parse(guardado["amoma-pedido"] ?? "[]"),
  };
}

const TORTA = [
  { nombre: "Chica", precio: 2600000 },
  { nombre: "Mediana", precio: 3600000 },
  { nombre: "Grande", precio: 5400000 },
];
const torta = (variante) => ({
  id: "torta",
  nombre: "Torta",
  variante,
  precio: TORTA.find((o) => o.nombre === variante)?.precio ?? null,
  opciones: TORTA,
});
const chipa = {
  id: "chipa",
  nombre: "Chipá",
  variante: "Docena",
  precio: 800000,
};

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
  const r = resumenPedido(lista);
  assert.equal(r.unidades, 3);
  assert.equal(r.total, 5200000);
  assert.equal(r.aConfirmar, 0);
});

test("si algún producto no tiene precio: subtotal + 'a confirmar'", () => {
  const conCharlotte = [
    ...lista,
    { clave: "c", nombre: "Charlotte", precio: null, cantidad: 1 },
  ];
  const r = resumenPedido(conCharlotte);
  assert.equal(r.total, null);
  assert.equal(r.subtotal, 5200000);
  assert.equal(r.aConfirmar, 1);
  const m = mensajePedido(conCharlotte);
  assert.match(m, /1 × Charlotte — precio a confirmar/);
  assert.match(m, /Subtotal estimado: \$\s?52\.000 \+ 1 a confirmar/);
});

test("nada tiene precio: 'Precio: a confirmar'", () => {
  const m = mensajePedido([
    {
      clave: "x",
      nombre: "Chipá",
      variante: "Docena",
      precio: null,
      cantidad: 3,
    },
  ]);
  assert.match(m, /3 × Chipá \(Docena\) — precio a confirmar/);
  assert.match(m, /Precio: a confirmar/);
});

test("el mensaje de WhatsApp lista todo, con total, fecha y nota", () => {
  const m = mensajePedido(lista, {
    fecha: "2026-12-12",
    nombre: "  Ana ",
    nota: "Sin nueces",
  });
  assert.match(m, /Soy Ana\./);
  assert.match(m, /1 × Torta de frutos rojos \(Mediana\) — \$\s?36\.000/);
  assert.match(m, /2 × Chipá \(Docena\) — \$\s?16\.000/);
  assert.match(m, /Total estimado: \$\s?52\.000/);
  assert.match(m, /Para el sábado,? 12 de diciembre/);
  assert.match(m, /Nota: Sin nueces/);
  assert.doesNotMatch(m, /\n\n\n/, "sin renglones vacíos de más");
});

test("sin nombre ni fecha ni nota, el mensaje queda prolijo", () => {
  const m = mensajePedido(lista, { nombre: "   ", nota: "" });
  assert.match(m, /^¡Hola Amoma! Quiero hacer este pedido:/);
  assert.doesNotMatch(m, /Soy|Para el|Nota:/);
  assert.doesNotMatch(m, /\n\n\n/);
});

test("mismo producto chico y grande: dos líneas, una al lado de la otra", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.agregarAlPedido(chipa);
  m.agregarAlPedido(torta("Grande"));
  m.agregarAlPedido(torta("Chica"));
  const g = m.leerGuardado();
  assert.deepEqual(
    g.map((x) => `${x.cantidad} ${x.id} ${x.variante}`),
    ["2 torta Chica", "1 torta Grande", "1 chipa Docena"],
  );
  assert.equal(resumenPedido(g).total, 2 * 2600000 + 5400000 + 800000);
});

test("cambiar de tamaño a uno que ya está: se juntan las cantidades", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.agregarAlPedido(torta("Chica"));
  m.agregarAlPedido(torta("Grande"));
  m.cambiarVariante("torta::Chica", TORTA[2]);
  const g = m.leerGuardado();
  assert.equal(g.length, 1);
  assert.equal(g[0].variante, "Grande");
  assert.equal(g[0].cantidad, 3);
  assert.equal(g[0].precio, 5400000);
});

test("cambiar de tamaño a uno nuevo: misma línea, mismo lugar, precio nuevo", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.agregarAlPedido(chipa);
  m.cambiarVariante("torta::Chica", TORTA[1]);
  const g = m.leerGuardado();
  assert.deepEqual(
    g.map((x) => x.clave),
    ["torta::Mediana", "chipa::Docena"],
  );
  assert.equal(g[0].precio, 3600000);
  // volver al mismo tamaño no hace nada; tamaño inexistente tampoco rompe
  m.cambiarVariante("torta::Mediana", TORTA[1]);
  m.cambiarVariante("no-existe::X", TORTA[0]);
  m.cambiarVariante("torta::Mediana", undefined);
  assert.equal(m.leerGuardado().length, 2);
});

test("ida y vuelta de tamaños varias veces no duplica ni pierde unidades", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.cambiarCantidad("torta::Chica", 4);
  for (const t of ["Grande", "Mediana", "Chica", "Grande", "Chica"]) {
    const actual = m.leerGuardado()[0].clave;
    m.cambiarVariante(
      actual,
      TORTA.find((o) => o.nombre === t),
    );
  }
  const g = m.leerGuardado();
  assert.equal(g.length, 1);
  assert.equal(g[0].cantidad, 4);
  assert.equal(g[0].variante, "Chica");
});

test("cantidades: tope 99, y 0/negativo/basura quita el producto", async () => {
  const m = await nuevoPedido();
  for (let i = 0; i < 150; i++) m.agregarAlPedido(chipa);
  assert.equal(m.leerGuardado()[0].cantidad, 99);
  m.cambiarCantidad("chipa::Docena", 5000);
  assert.equal(m.leerGuardado()[0].cantidad, 99);
  m.cambiarCantidad("chipa::Docena", 2.7);
  assert.equal(m.leerGuardado()[0].cantidad, 2);
  m.cambiarCantidad("chipa::Docena", "hola");
  assert.equal(m.leerGuardado().length, 0);
  m.agregarAlPedido(chipa);
  m.cambiarCantidad("chipa::Docena", -3);
  assert.equal(m.leerGuardado().length, 0);
});

test("juntar dos tamaños respeta el tope de 99", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.cambiarCantidad("torta::Chica", 80);
  m.agregarAlPedido(torta("Grande"));
  m.cambiarCantidad("torta::Grande", 80);
  m.cambiarVariante("torta::Chica", TORTA[2]);
  assert.equal(m.leerGuardado()[0].cantidad, 99);
});

test("deshacer: vuelve en el mismo lugar y con la misma cantidad", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(torta("Chica"));
  m.agregarAlPedido(chipa);
  m.agregarAlPedido({
    id: "lemon",
    nombre: "Lemon pie",
    variante: "Grande",
    precio: null,
  });
  m.cambiarCantidad("chipa::Docena", 3);
  const item = m.leerGuardado()[1];
  m.cambiarCantidad("chipa::Docena", 0);
  m.restaurar(item, 1);
  m.restaurar(item, 1); // doble toque en "Deshacer" no lo duplica
  const g = m.leerGuardado();
  assert.deepEqual(
    g.map((x) => x.id),
    ["torta", "chipa", "lemon"],
  );
  assert.equal(g[1].cantidad, 3);
});

test("vaciar deja el pedido en cero", async () => {
  const m = await nuevoPedido();
  m.agregarAlPedido(chipa);
  m.vaciarPedido();
  assert.deepEqual(m.leerGuardado(), []);
});

test("lo guardado roto o tocado a mano no rompe la página", async () => {
  for (const basura of [
    "{no es json",
    "42",
    '{"a":1}',
    "null",
    '[null, 3, "x"]',
  ]) {
    const m = await nuevoPedido(basura);
    m.agregarAlPedido(chipa);
    assert.equal(m.leerGuardado().length, 1, basura);
  }
  const m = await nuevoPedido(
    JSON.stringify([
      { id: "chipa", variante: "Docena", cantidad: "3" },
      { id: "chipa", variante: "Docena", cantidad: 5 }, // repetido
      { id: "torta", variante: "Grande", cantidad: 1e9 },
      { id: "lemon", variante: null, cantidad: -1 },
      { nombre: "sin id", cantidad: 1 },
    ]),
  );
  m.cambiarCantidad("x", 1); // fuerza un guardado
  const g = m.leerGuardado();
  assert.deepEqual(
    g.map((x) => `${x.clave}=${x.cantidad}`),
    ["chipa::Docena=3", "torta::Grande=99"],
  );
});

test("sin almacenamiento (modo privado) igual funciona", async () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("bloqueado");
    },
    setItem: () => {
      throw new Error("bloqueado");
    },
  };
  const m = await import(`../src/lib/pedido.js?t=${n++}`);
  m.agregarAlPedido(chipa);
  m.agregarAlPedido(chipa);
  // no hay error; el estado vive en memoria
  assert.ok(true);
});

// ---------- con el catálogo actual ----------

const catalogo = [
  {
    id: "torta",
    nombre: "Torta de frutos rojos",
    variantes: [
      { nombre: "Chica", precio: 2800000 }, // la dueña subió el precio
      { nombre: "Grande", precio: 5600000 },
      // "Mediana" ya no existe
    ],
  },
  { id: "lemon", nombre: "Lemon pie", variantes: [] }, // sin tamaños cargados
];
const genericos = [
  { nombre: "Chica" },
  { nombre: "Mediana" },
  { nombre: "Grande" },
];

test("precio y nombre se toman del catálogo actual, no de lo guardado", () => {
  const [x] = conCatalogo(
    [
      {
        clave: "torta::Chica",
        id: "torta",
        nombre: "Viejo",
        variante: "Chica",
        precio: 1,
        cantidad: 2,
      },
    ],
    catalogo,
    { genericos },
  );
  assert.equal(x.nombre, "Torta de frutos rojos");
  assert.equal(x.precio, 2800000);
  assert.equal(x.estado, "ok");
  assert.equal(resumenPedido([x]).total, 5600000);
});

test("tamaño que ya no existe: se pide elegir otro y no entra al mensaje", () => {
  const items = conCatalogo(
    [
      {
        clave: "torta::Mediana",
        id: "torta",
        variante: "Mediana",
        precio: 3600000,
        cantidad: 1,
      },
      {
        clave: "torta::Grande",
        id: "torta",
        variante: "Grande",
        precio: 1,
        cantidad: 1,
      },
    ],
    catalogo,
    { genericos },
  );
  assert.equal(items[0].estado, "sin-tamano");
  assert.deepEqual(
    items[0].opciones.map((o) => o.nombre),
    ["Chica", "Grande"],
  );
  const r = resumenPedido(items);
  assert.equal(r.problemas, 1);
  assert.equal(r.unidades, 1);
  assert.equal(r.total, 5600000);
  assert.doesNotMatch(mensajePedido(items), /Mediana/);
});

test("producto que ya no está: se avisa, pero no mientras el catálogo carga", () => {
  const guardado = [
    {
      clave: "chipa::Docena",
      id: "chipa",
      nombre: "Chipá",
      variante: "Docena",
      precio: 800000,
      cantidad: 2,
    },
  ];
  const cargando = conCatalogo(guardado, catalogo, {
    genericos,
    definitivo: false,
  });
  assert.equal(cargando[0].estado, "ok");
  const listo = conCatalogo(guardado, catalogo, {
    genericos,
    definitivo: true,
  });
  assert.equal(listo[0].estado, "no-disponible");
  assert.equal(resumenPedido(listo).unidades, 0);
  assert.doesNotMatch(mensajePedido(listo), /Chipá/);
});

test("producto sin tamaños cargados usa Chica/Mediana/Grande sin precio", () => {
  assert.deepEqual(
    opcionesDe(catalogo[1], genericos).map((o) => o.nombre),
    ["Chica", "Mediana", "Grande"],
  );
  const [x] = conCatalogo(
    [{ clave: "lemon::Grande", id: "lemon", variante: "Grande", cantidad: 1 }],
    catalogo,
    { genericos },
  );
  assert.equal(x.estado, "ok");
  assert.equal(x.precio, null);
});

// ---------- "tocar mucho": miles de toques al azar ----------

test("5.000 toques al azar: el pedido siempre queda coherente", async () => {
  const m = await nuevoPedido();
  let semilla = 7;
  const azar = (k) => (
    (semilla = (semilla * 1103515245 + 12345) % 2 ** 31),
    semilla % k
  );
  const productos = [
    { id: "torta", opciones: TORTA },
    {
      id: "chipa",
      opciones: [
        { nombre: "Media docena", precio: 450000 },
        { nombre: "Docena", precio: 800000 },
      ],
    },
    {
      id: "lemon",
      opciones: [
        { nombre: "Chica", precio: null },
        { nombre: "Grande", precio: null },
      ],
    },
  ];
  for (let i = 0; i < 5000; i++) {
    const g = m.leerGuardado();
    const x = g.length ? g[azar(g.length)] : null;
    const p = productos[azar(productos.length)];
    const op = p.opciones[azar(p.opciones.length)];
    switch (azar(7)) {
      case 0:
      case 1:
        m.agregarAlPedido({
          id: p.id,
          nombre: p.id,
          variante: op.nombre,
          precio: op.precio,
          opciones: p.opciones,
        });
        break;
      case 2:
        if (x) m.cambiarCantidad(x.clave, x.cantidad + 1);
        break;
      case 3:
        if (x) m.cambiarCantidad(x.clave, x.cantidad - 1);
        break;
      case 4:
        if (x) {
          const ops = productos.find((q) => q.id === x.id).opciones;
          m.cambiarVariante(x.clave, ops[azar(ops.length)]);
        }
        break;
      case 5:
        if (x) {
          const lugar = g.indexOf(x);
          m.cambiarCantidad(x.clave, 0);
          if (azar(2)) m.restaurar(x, lugar);
        }
        break;
      default:
        if (!azar(40)) m.vaciarPedido();
    }
    const ahora = m.leerGuardado();
    const claves = ahora.map((y) => y.clave);
    assert.equal(new Set(claves).size, claves.length, "sin líneas repetidas");
    for (const y of ahora) {
      assert.ok(
        Number.isInteger(y.cantidad) && y.cantidad >= 1 && y.cantidad <= 99,
      );
      assert.equal(y.clave, `${y.id}::${y.variante}`);
      const precioReal = productos
        .find((q) => q.id === y.id)
        .opciones.find((o) => o.nombre === y.variante).precio;
      assert.equal(y.precio, precioReal, "el precio corresponde al tamaño");
    }
    const r = resumenPedido(ahora);
    assert.equal(
      r.unidades,
      ahora.reduce((s, y) => s + y.cantidad, 0),
    );
    // cada producto en distintos tamaños queda junto
    const orden = ahora.map((y) => y.id).filter((id, k, a) => id !== a[k - 1]);
    assert.equal(
      new Set(orden).size,
      orden.length,
      "tamaños del mismo producto juntos",
    );
  }
});

test("pedido enorme: el mensaje sigue entrando en un link de WhatsApp", () => {
  const grande = Array.from({ length: 30 }, (_, i) => ({
    clave: `p${i}`,
    nombre: `Producto con nombre bastante largo ${i}`,
    variante: "Para eventos (x 50)",
    precio: 3000000,
    cantidad: 99,
  }));
  const m = mensajePedido(grande, {
    nombre: "Ana",
    nota: "x".repeat(300),
    fecha: "2026-12-12",
  });
  assert.ok(encodeURIComponent(m).length < 8000, "largo razonable para wa.me");
});
