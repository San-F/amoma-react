// Contenido de la página. Hoy es fijo; en la Etapa 3 sale de Supabase
// (lo carga la dueña desde el panel) con esta misma forma.
import { fotos, portada } from "./images";

export const negocio = {
  nombre: "Amoma",
  lema: "Casero y hecho con amor",
  whatsapp: "5491136362466",
  telefonoVisible: "11 3636 2466",
  instagram: "amoma.cakeshop",
  zona: "Villa Pueyrredón, CABA",
};

// Las 3 puertas de entrada de la home
// `tono`: colores que toma el fondo de la sección al pasar por cada tarjeta
// (contraste AA medido para texto y acento)
export const categorias = [
  {
    id: "tortas",
    nombre: "Tortas",
    descripcion: "Clásicas y caseras.",
    foto: portada.tortas,
    destino: "/?categoria=tortas#tortas",
    tono: { fondo: "#2a1915", texto: "#fbf5ee", acento: "#f3a6bd" },
  },
  {
    id: "postres",
    nombre: "Tartas y postres",
    descripcion: "Tartas, porciones y cajitas.",
    foto: portada.postres,
    destino: "/?categoria=postres#tortas",
    tono: { fondo: "#f5d5de", texto: "#3b2420", acento: "#9a3556" },
  },
  {
    id: "salado",
    nombre: "Salado",
    descripcion: "Chipá y bocaditos.",
    foto: portada.salado,
    destino: "/?categoria=salado#tortas",
    tono: { fondo: "#f2dfb8", texto: "#3b2420", acento: "#7a3f0e" },
  },
  {
    id: "personalizadas",
    nombre: "Tortas personalizadas",
    descripcion: "Para tu evento, como la imagines.",
    foto: portada.personalizadas,
    destino: "/#personalizada",
    tono: { fondo: "#1f1a1b", texto: "#fbf5ee", acento: "#f3a6bd" },
  },
];

export const filtros = [
  { id: "todas", nombre: "Todas" },
  { id: "tortas", nombre: "Tortas" },
  { id: "postres", nombre: "Tartas y postres" },
  { id: "salado", nombre: "Salado" },
];

// ⚠️ Descripciones de ejemplo: confirmar con la dueña (ver docs/PENDIENTES.md).
export const productos = [
  {
    id: "frutos-rojos",
    categoria: "tortas",
    nombre: "Torta de frutos rojos",
    descripcion:
      "Bizcochuelo de chocolate, dulce de leche, crema y frutillas frescas.",
    foto: fotos.frutosRojos,
  },
  {
    id: "chocolate-rosetas",
    categoria: "tortas",
    nombre: "Chocolate y rosetas",
    descripcion:
      "Chocolate intenso, borde de dulce de leche y rosetas de crema.",
    foto: fotos.chocolateRosetas,
  },
  {
    id: "lemon-pie",
    categoria: "postres",
    nombre: "Lemon pie",
    descripcion: "Masa sablé, crema de limón y merengue.",
    foto: fotos.lemonPie,
  },
  {
    id: "charlotte",
    categoria: "tortas",
    nombre: "Charlotte",
    descripcion: "Vainillas, mousse y un moño para regalar.",
    foto: fotos.charlotte,
  },
  {
    id: "crumble",
    categoria: "postres",
    nombre: "Tarta de dulce de leche",
    descripcion: "Base crocante, mucho dulce de leche y crumble.",
    foto: fotos.dulceDeLecheCrumble,
  },
  {
    id: "arandanos",
    categoria: "tortas",
    nombre: "Torta de arándanos",
    descripcion: "Crema, dulce de leche y arándanos.",
    foto: fotos.arandanos,
  },
  {
    id: "tartitas",
    categoria: "postres",
    nombre: "Cajita de tartitas",
    descripcion: "Seis tartitas decoradas. Ideales para regalar.",
    foto: fotos.tartitasHalloween,
  },
  {
    // ⚠️ Opciones a confirmar con la dueña
    id: "chipa",
    categoria: "salado",
    nombre: "Chipá",
    descripcion: "Casero, recién horneado, con mucho queso.",
    foto: fotos.chipa,
    variantes: [
      { id: "media", nombre: "Media docena", porciones: null, precio: null },
      { id: "docena", nombre: "Docena", porciones: null, precio: null },
      { id: "evento", nombre: "Para eventos", porciones: null, precio: null },
    ],
  },
];

export const galeria = [
  fotos.frutosRojos,
  fotos.arcoiris,
  fotos.chocolateRosetas,
  fotos.lemonPie,
  fotos.charlotte,
  fotos.surf,
  fotos.dulceDeLecheCrumble,
  fotos.arandanos,
  fotos.calabaza,
  fotos.tartitasHalloween,
];

// "Armá tu torta". ⚠️ Sabores de ejemplo: confirmar con la dueña (ver docs/PENDIENTES.md).
// Los colores solo se usan para dibujar la ilustración.
export const opcionesTorta = {
  bizcochuelo: {
    titulo: "Bizcochuelo",
    opciones: [
      {
        id: "vainilla",
        nombre: "Vainilla",
        color: "#F2D49B",
        sombra: "#DDB577",
      },
      {
        id: "chocolate",
        nombre: "Chocolate",
        color: "#6B3B2A",
        sombra: "#4E2A1E",
      },
      {
        id: "red-velvet",
        nombre: "Red velvet",
        color: "#A3333D",
        sombra: "#7E2530",
      },
    ],
  },
  relleno: {
    titulo: "Relleno",
    opciones: [
      { id: "ddl", nombre: "Dulce de leche", color: "#B8743A" },
      { id: "crema-frutillas", nombre: "Crema y frutillas", color: "#F4C3CB" },
      { id: "ganache", nombre: "Ganache", color: "#3F2219" },
      { id: "limon", nombre: "Crema de limón", color: "#F1DC72" },
    ],
  },
  cobertura: {
    titulo: "Cobertura",
    opciones: [
      {
        id: "chantilly",
        nombre: "Crema chantilly",
        color: "#FFF9F1",
        sombra: "#EADFD0",
      },
      {
        id: "ganache",
        nombre: "Ganache de chocolate",
        color: "#4A281C",
        sombra: "#341B13",
      },
      {
        id: "rosa",
        nombre: "Buttercream rosa",
        color: "#F6C1D0",
        sombra: "#E79FB4",
      },
    ],
  },
  decoracion: {
    titulo: "Decoración",
    opciones: [
      { id: "frutos-rojos", nombre: "Frutos rojos" },
      { id: "rosetas", nombre: "Rosetas" },
      { id: "flores", nombre: "Flores" },
      { id: "chocolate", nombre: "Chocolate rallado" },
    ],
  },
};

export const tamanos = [
  { id: "chica", nombre: "Chica", detalle: "8–10 porciones" },
  { id: "mediana", nombre: "Mediana", detalle: "15 porciones" },
  { id: "grande", nombre: "Grande", detalle: "25 porciones" },
];

// Precios INVENTADOS solo para ver cómo se ve el diseño. Se muestran únicamente
// entrando con ?precios=demo (nunca en la página normal). Los reales los carga
// la dueña en el panel.
const t = (chica, mediana, grande) => [
  { id: "chica", nombre: "Chica", porciones: 10, precio: chica * 100 },
  { id: "mediana", nombre: "Mediana", porciones: 15, precio: mediana * 100 },
  { id: "grande", nombre: "Grande", porciones: 25, precio: grande * 100 },
];
// etiquetas de ejemplo (solo en ?precios=demo)
export const etiquetasDeEjemplo = {
  "frutos-rojos": "mas-pedido",
  chipa: "nuevo",
  charlotte: "temporada",
};

export const preciosDeEjemplo = {
  "frutos-rojos": t(26000, 36000, 54000),
  "chocolate-rosetas": t(24000, 34000, 50000),
  "lemon-pie": [
    { id: "chica", nombre: "Chica", porciones: 8, precio: 1800000 },
    { id: "grande", nombre: "Grande", porciones: 16, precio: 3200000 },
  ],
  charlotte: t(28000, 39000, 58000),
  crumble: [
    { id: "chica", nombre: "Chica", porciones: 8, precio: 1600000 },
    { id: "grande", nombre: "Grande", porciones: 16, precio: 2900000 },
  ],
  arandanos: t(25000, 35000, 52000),
  tartitas: [
    { id: "caja", nombre: "Caja x 6", porciones: null, precio: 1500000 },
  ],
  chipa: [
    { id: "media", nombre: "Media docena", porciones: null, precio: 450000 },
    { id: "docena", nombre: "Docena", porciones: null, precio: 800000 },
    {
      id: "evento",
      nombre: "Para eventos (x 50)",
      porciones: null,
      precio: 3000000,
    },
  ],
};
