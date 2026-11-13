// Arma la planilla Excel (.xlsx) del catálogo: sobria y prolija, para
// entregar. Dos hojas: "Catálogo" (los datos) y "Cómo usar" (instrucciones).
// Se usa la versión "universal" de la librería: no usa procesos aparte del
// navegador (los bloquearía la política de seguridad del sitio).
import writeExcelFile from "write-excel-file/universal";
import {
  getOrderOfSiblings,
  insertElementMarkupAccordingToOrderOfSiblings,
  sanitizeAttributeValue,
  sanitizeTextContent,
} from "write-excel-file/utility";
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

// ---------- desplegables (validación de datos de Excel) ----------
// La librería no los trae: se agregan al XML de la hoja con un "feature".
// Cada hoja puede pasar `desplegables: [{ rango, formula, titulo, mensaje }]`.
const HASTA_FILA = 1000;

function reglaXml({ rango, formula, titulo, mensaje }) {
  const atr = (v) => sanitizeAttributeValue(v);
  return (
    `<dataValidation type="list" allowBlank="1" ` +
    `showErrorMessage="1" errorStyle="stop" errorTitle="${atr(titulo)}" ` +
    `error="${atr(mensaje)}" sqref="${rango}">` +
    `<formula1>${sanitizeTextContent(formula)}</formula1></dataValidation>`
  );
}

const conDesplegables = {
  files: {
    transform: {
      "xl/worksheets/sheet{id}.xml": {
        transform(xml, opciones) {
          const lista = opciones.desplegables;
          if (!lista?.length) return xml;
          return insertElementMarkupAccordingToOrderOfSiblings(
            xml,
            `<dataValidations count="${lista.length}">${lista.map(reglaXml).join("")}</dataValidations>`,
            getOrderOfSiblings("xl/worksheets/sheet{id}.xml", "worksheet"),
            "worksheet",
          );
        },
      },
    },
  },
};

const HOJA_AYUDA = "Cómo usar";

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
    titulo(
      "Categorías válidas (también en el desplegable de la columna Categoría)",
    ),
    // sin viñeta: el desplegable de la hoja Catálogo toma estas celdas tal cual
    ...categorias.map((c) => [{ value: c.name, textColor: CACAO, indent: 1 }]),
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
  const ayuda = instrucciones(categorias, { vacia });
  // fila (1 = primera) donde empiezan los nombres de categoría en "Cómo usar"
  const desde = ayuda.findIndex((f) => f[0]?.value === categorias[0]?.name) + 1;
  const hasta = desde + categorias.length - 1;
  const desplegables = [
    {
      rango: `G2:G${HASTA_FILA}`,
      formula: '"sí,no"',
      titulo: "Publicado",
      mensaje: "Elegí “sí” o “no” (o dejalo vacío para que quede como está).",
    },
  ];
  if (categorias.length && desde > 0)
    desplegables.unshift({
      rango: `B2:B${HASTA_FILA}`,
      formula: `'${HOJA_AYUDA}'!$A$${desde}:$A$${hasta}`,
      titulo: "Categoría",
      mensaje: "Elegí una de las categorías de la lista.",
    });
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
        desplegables,
      },
      {
        sheet: HOJA_AYUDA,
        data: ayuda,
        columns: [{ width: 120 }],
        showGridLines: false,
        orientation: "landscape",
      },
    ],
    { fontFamily: LETRA, fontSize: 11, features: [conDesplegables] },
  ).toBlob();
}
