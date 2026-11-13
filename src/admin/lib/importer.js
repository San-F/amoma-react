// Lectura y validación de la planilla de catálogo (Excel o CSV).
// Es código puro (sin navegador) para poder probarlo con tests.
import { pesosACentavos } from "../../lib/money.js";
import { slugify } from "../../lib/slug.js";

// Encabezados de la planilla (como los ve la dueña en Excel)
export const ENCABEZADOS = [
  "Nombre",
  "Categoría",
  "Descripción",
  "Tamaño",
  "Porciones",
  "Precio",
  "Publicado",
  "Código (no tocar)",
];

// Filas de ejemplo de la planilla vacía: su código empieza con "ejemplo" y
// al subirla se ignoran (se pueden dejar o borrar).
export const MARCA_EJEMPLO = "ejemplo";
const EJEMPLO = [
  [
    "Lemon pie",
    "Tartas y postres",
    "Masa sablé, crema de limón y merengue",
    "Chica",
    8,
    18000,
    "sí",
    "ejemplo (se ignora)",
  ],
  ["Lemon pie", "", "", "Grande", 16, 32000, "", "ejemplo (se ignora)"],
  [
    "Torta de frutos rojos",
    "Tortas",
    "Chocolate, dulce de leche y frutillas",
    "Mediana",
    15,
    35000,
    "sí",
    "ejemplo (se ignora)",
  ],
];

// Filas de la planilla vacía (solo ejemplos).
export function filasModelo() {
  return EJEMPLO.map((f) => [...f]);
}

// Filas con TODO lo que hay cargado: una por tamaño. La dueña cambia precios o
// agrega filas y la vuelve a subir. El código une cada fila con su producto
// (así se puede cambiar el nombre sin crear un duplicado).
export function filasCatalogo(productos) {
  const filas = [];
  for (const p of productos) {
    const vs = p.variants.length
      ? p.variants
      : [{ label: "", servings: null, price_cents: null }];
    vs.forEach((v, i) =>
      filas.push([
        p.name,
        i === 0 ? (p.category?.name ?? "") : "",
        i === 0 ? (p.short_description ?? "") : "",
        v.label,
        v.servings ?? null,
        v.price_cents == null ? null : v.price_cents / 100,
        i === 0 ? (p.is_published ? "sí" : "no") : "",
        p.code,
      ]),
    );
  }
  return filas;
}

// CSV simple con comillas; detecta ";" o "," mirando la primera línea.
export function parsearCSV(texto) {
  const limpio = texto.replace(/^﻿/, "");
  const primera = limpio.split(/\r?\n/, 1)[0] ?? "";
  const sep =
    (primera.match(/;/g) || []).length >= (primera.match(/,/g) || []).length
      ? ";"
      : ",";
  const filas = [];
  let fila = [];
  let celda = "";
  let enComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const ch = limpio[i];
    if (enComillas) {
      if (ch === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (ch === '"') enComillas = false;
      else celda += ch;
    } else if (ch === '"') enComillas = true;
    else if (ch === sep) {
      fila.push(celda);
      celda = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += ch;
  }
  if (celda !== "" || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

// "Código (no tocar)" → "codigo"; "Precio ($)" → "precio"
const normalizarEncabezado = (t) =>
  String(t ?? "")
    .replace(/\(.*?\)/g, "")
    .replace(/\$/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const ALIAS = {
  nombre: "nombre",
  producto: "nombre",
  categoria: "categoria",
  descripcion: "descripcion",
  tamano: "tamaño",
  tamanio: "tamaño",
  size: "tamaño",
  porciones: "porciones",
  precio: "precio",
  foto: "foto",
  imagen: "foto",
  publicado: "publicado",
  visible: "publicado",
  codigo: "codigo",
};

const SI = new Set([
  "si",
  "sí",
  "s",
  "yes",
  "y",
  "true",
  "1",
  "x",
  "verdadero",
]);
const NO = new Set(["no", "n", "false", "0", "falso"]);

function aBooleano(valor) {
  if (valor === true || valor === false) return valor;
  const t = String(valor ?? "")
    .trim()
    .toLowerCase();
  if (t === "") return null;
  if (SI.has(t)) return true;
  if (NO.has(t)) return false;
  return undefined; // inválido
}

const texto = (v) => (v == null ? "" : String(v).trim());
// saca el apóstrofo que protege de fórmulas al exportar
const sinGuarda = (t) => t.replace(/^'(?=[=+\-@])/, "");

// nombre de archivo sin carpeta ni extensión, para unir con las fotos subidas
export const claveFoto = (nombre) =>
  texto(nombre)
    .split(/[\\/]/)
    .pop()
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase();

/**
 * Convierte las filas de la planilla en productos validados.
 * @param {Array<Array<any>>} filas  primera fila = encabezados
 * @param {Array<{slug: string, name: string}>} categorias  existentes en la base
 * @returns {{ productos: Array, errores: string[] }}
 */
export function interpretarPlanilla(filas, categorias) {
  const errores = [];
  if (!filas.length)
    return { productos: [], errores: ["La planilla está vacía."] };

  const encabezados = filas[0].map(
    (h) => ALIAS[normalizarEncabezado(h)] ?? null,
  );
  for (const requerida of ["nombre", "precio"]) {
    if (!encabezados.includes(requerida)) {
      errores.push(`Falta la columna "${requerida}". Usá la planilla modelo.`);
    }
  }
  if (errores.length) return { productos: [], errores };

  const porCategoria = new Map();
  for (const c of categorias) {
    porCategoria.set(c.slug, c.slug);
    porCategoria.set(slugify(c.name), c.slug);
  }

  const productos = new Map();
  filas.slice(1).forEach((fila, i) => {
    const n = i + 2; // número de fila como lo ve la persona en Excel
    const r = {};
    encabezados.forEach((col, j) => {
      if (!col) return;
      const v = fila[j];
      r[col] = typeof v === "string" ? sinGuarda(v.trim()) : v;
    });
    if (Object.values(r).every((v) => texto(v) === "")) return; // fila vacía
    // filas de ejemplo de la planilla vacía
    if (texto(r.codigo).toLowerCase().startsWith(MARCA_EJEMPLO)) return;

    const nombre = texto(r.nombre);
    if (!nombre) {
      errores.push(`Fila ${n}: falta el nombre.`);
      return;
    }
    if (nombre.length > 120)
      errores.push(`Fila ${n}: el nombre es muy largo (máx. 120).`);

    // Código de número (planilla descargada): une la fila con su producto
    // aunque le hayan cambiado el nombre. Sin código = producto nuevo (o el
    // que hoy se llama igual).
    const codigoTexto = texto(r.codigo).replace(/\.0+$/, "");
    let code = null;
    if (codigoTexto) {
      if (!/^\d{1,9}$/.test(codigoTexto)) {
        errores.push(
          `Fila ${n}: el código "${codigoTexto}" no es válido. No cambies esa columna (en las filas nuevas va vacía).`,
        );
        return;
      }
      code = Number.parseInt(codigoTexto, 10);
    }
    const slug = slugify(nombre);
    if (!slug) {
      errores.push(`Fila ${n}: el nombre "${nombre}" no sirve (usá letras).`);
      return;
    }
    const clave = code != null ? `#${code}` : `nuevo:${slug}`;
    let p = productos.get(clave);
    if (!p) {
      p = {
        code,
        slug,
        name: nombre,
        category_slug: null,
        short_description: "",
        // null = "no dice": lo que ya existe queda como estaba
        is_published: null,
        foto: "",
        variants: [],
        fila: n,
      };
      productos.set(clave, p);
    }

    if (texto(r.categoria)) {
      const cat = porCategoria.get(slugify(r.categoria));
      if (!cat)
        errores.push(
          `Fila ${n}: la categoría "${texto(r.categoria)}" no existe.`,
        );
      else p.category_slug = cat;
    }
    if (texto(r.descripcion)) {
      if (texto(r.descripcion).length > 200)
        errores.push(`Fila ${n}: la descripción es muy larga (máx. 200).`);
      p.short_description = texto(r.descripcion).slice(0, 200);
    }
    if (texto(r.foto)) p.foto = texto(r.foto);
    const pub = aBooleano(r.publicado);
    if (pub === undefined)
      errores.push(`Fila ${n}: "publicado" tiene que ser sí o no.`);
    else if (pub !== null) p.is_published = pub;

    const tieneVariante = texto(r["tamaño"]) || texto(r.precio);
    if (tieneVariante) {
      const precio = pesosACentavos(r.precio);
      if (precio == null) {
        errores.push(
          `Fila ${n}: el precio "${texto(r.precio)}" no es válido (ej.: 18000).`,
        );
        return;
      }
      let porciones = null;
      if (texto(r.porciones)) {
        porciones = Number.parseInt(texto(r.porciones), 10);
        if (
          !Number.isInteger(porciones) ||
          porciones <= 0 ||
          porciones > 1000
        ) {
          errores.push(
            `Fila ${n}: "porciones" tiene que ser un número (ej.: 15).`,
          );
          porciones = null;
        }
      }
      const label = (texto(r["tamaño"]) || "Única").slice(0, 60);
      if (p.variants.some((v) => v.label.toLowerCase() === label.toLowerCase()))
        errores.push(
          `Fila ${n}: el tamaño "${label}" de "${p.name}" está repetido.`,
        );
      p.variants.push({
        label,
        servings: porciones,
        price_cents: precio,
      });
    }
  });

  // una fila nueva (sin código) que repite el nombre de una que tiene código
  const conCodigo = [...productos.values()].filter((p) => p.code != null);
  for (const p of productos.values()) {
    if (p.code != null) continue;
    const igual = conCodigo.find(
      (o) => o.name.trim().toLowerCase() === p.name.trim().toLowerCase(),
    );
    if (igual)
      errores.push(
        `Fila ${p.fila}: "${p.name}" ya está en la planilla con el código ${igual.code}. Si es el mismo producto, poné sus tamaños con ese código.`,
      );
  }

  for (const p of productos.values()) {
    if (!p.variants.length)
      errores.push(`"${p.name}": no tiene ningún precio cargado.`);
  }
  if (productos.size > 500) errores.push("Máximo 500 productos por planilla.");

  return { productos: [...productos.values()], errores };
}
