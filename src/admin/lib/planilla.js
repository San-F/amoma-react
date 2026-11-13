// Arma la planilla Excel (.xlsx) del catálogo: sobria y prolija, para
// entregar. Dos hojas: "Catálogo" (los datos) y "Cómo usar" (instrucciones).
// Se usa la versión "universal" de la librería: no usa procesos aparte del
// navegador (los bloquearía la política de seguridad del sitio).
import writeExcelFile from "write-excel-file/universal";
import { ENCABEZADOS, filasCatalogo, filasModelo } from "./importer.js";

const CACAO = "#3B2420";
const CREMA = "#FBF5EE";
const BORDE = "#E7D9CF";
const GRIS = "#9A8A82";
const LETRA = "Calibri";

const ANCHOS = [26, 18, 40, 15, 11, 13, 11, 18];
const FORMATO_PRECIO = '"$" #,##0';

function encabezado() {
  return ENCABEZADOS.map((t, i) => ({
    value: t,
    fontWeight: "bold",
    textColor: i === ENCABEZADOS.length - 1 ? "#D9C6BC" : "#FFFFFF",
    backgroundColor: CACAO,
    alignVertical: "center",
    height: 26,
    borderColor: CACAO,
  }));
}

// Cada producto en una franja (blanco / crema), así se ve qué filas van juntas.
function cuerpo(filas, { ejemplo = false } = {}) {
  let franja = 0;
  let anterior = null;
  return filas.map((f) => {
    const clave = f[7] || f[0];
    if (clave !== anterior) {
      franja++;
      anterior = clave;
    }
    const fondo = franja % 2 ? "#FFFFFF" : CREMA;
    return f.map((valor, i) => {
      const celda = {
        value: valor === "" ? null : valor,
        backgroundColor: fondo,
        borderColor: BORDE,
        alignVertical: "center",
        textColor: ejemplo ? GRIS : CACAO,
      };
      if (ejemplo) celda.fontStyle = "italic";
      if (i === 2) celda.wrap = true; // descripción
      if (i === 4) {
        celda.type = Number;
        celda.align = "center";
      }
      if (i === 5) {
        celda.type = Number;
        celda.format = FORMATO_PRECIO;
        if (!ejemplo) celda.fontWeight = "bold";
      }
      if (i === 6) celda.align = "center";
      if (i === 7) {
        celda.type = typeof celda.value === "number" ? Number : String;
        celda.align = "center";
        celda.textColor = GRIS;
        celda.fontStyle = "italic";
      }
      // celda vacía: sin tipo ni formato (si no, la librería no la acepta)
      if (celda.value == null) {
        delete celda.type;
        delete celda.format;
      }
      return celda;
    });
  });
}

function instrucciones(categorias, { vacia }) {
  const titulo = (t) => [
    { value: t, fontWeight: "bold", fontSize: 13, textColor: CACAO },
  ];
  const linea = (t) => [{ value: t, textColor: CACAO, wrap: true }];
  return [
    [
      {
        value: "Amoma · Cómo usar esta planilla",
        fontWeight: "bold",
        fontSize: 16,
        textColor: CACAO,
      },
    ],
    [],
    titulo("1. Una fila por tamaño"),
    linea(
      "Si una torta tiene 2 tamaños, van 2 filas con el mismo nombre. Categoría, descripción y publicado van solo en la primera.",
    ),
    [],
    titulo("2. Cambiar precios"),
    linea(
      "Escribí el número sin puntos ni $ (ej. 28000). Lo que borres de la planilla NO se borra de la página.",
    ),
    [],
    titulo("3. Productos nuevos"),
    linea("Agregá filas al final y dejá vacía la columna “Código (no tocar)”."),
    vacia
      ? linea(
          "Las filas grises de ejemplo se ignoran al subir la planilla: podés dejarlas o borrarlas.",
        )
      : linea(
          "No cambies ni borres los códigos de las filas que ya estaban: así el panel reconoce cada torta aunque le cambies el nombre.",
        ),
    [],
    titulo("4. Columnas"),
    linea(
      "Categoría: una de las de abajo (tal cual). Publicado: “sí” o “no” (vacío = como está). Porciones: un número o vacío.",
    ),
    [],
    titulo("Categorías válidas"),
    ...categorias.map((c) => linea(`• ${c.name}`)),
    [],
    titulo("5. Subirla"),
    linea(
      "Panel → Productos → Excel → “Elegir planilla”. Antes de guardar te muestra cómo queda; si algo falla, no se guarda nada.",
    ),
    linea(
      "Las fotos no van en la planilla: se ponen en cada producto, tocando “+ Foto”.",
    ),
  ];
}

/**
 * @param {{ productos?: object[], categorias: {name:string}[], vacia?: boolean }} o
 * @returns {Promise<Blob>}
 */
export function armarPlanilla({ productos = [], categorias, vacia = false }) {
  const filas = vacia ? filasModelo() : filasCatalogo(productos);
  return writeExcelFile(
    [
      {
        sheet: "Catálogo",
        data: [encabezado(), ...cuerpo(filas, { ejemplo: vacia })],
        columns: ANCHOS.map((width) => ({ width })),
        stickyRowsCount: 1,
        showGridLines: false,
        orientation: "landscape",
        zoomScale: 1.1,
      },
      {
        sheet: "Cómo usar",
        data: instrucciones(categorias, { vacia }),
        columns: [{ width: 120 }],
        showGridLines: false,
        orientation: "landscape",
      },
    ],
    { fontFamily: LETRA, fontSize: 11 },
  ).toBlob();
}
