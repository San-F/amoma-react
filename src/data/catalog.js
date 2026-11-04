// Contenido de la página. Hoy es fijo; en la Etapa 3 sale de Supabase
// (lo carga la dueña desde el panel) con esta misma forma.
import { fotos } from "./images";

export const negocio = {
  nombre: "Amoma",
  lema: "Casero y hecho con amor",
  whatsapp: "5491136362466",
  telefonoVisible: "11 3636 2466",
  instagram: "amoma.cakeshop",
  zona: "Villa Pueyrredón, CABA",
};

export const destacados = [
  {
    id: "frutos-rojos",
    categoria: "Tortas",
    nombre: "Torta de frutos rojos",
    descripcion: "Chocolate, dulce de leche, crema y frutillas frescas.",
    foto: fotos.frutosRojos,
  },
  {
    id: "lemon-pie",
    categoria: "Tartas",
    nombre: "Lemon pie",
    descripcion: "Masa sablé, crema de limón y merengue.",
    foto: fotos.lemonPie,
  },
  {
    id: "charlotte",
    categoria: "Tortas",
    nombre: "Charlotte",
    descripcion: "Vainillas, mousse y un moño para regalar.",
    foto: fotos.charlotte,
  },
  {
    id: "personalizada",
    categoria: "Personalizadas",
    nombre: "Torta temática",
    descripcion: "La diseñamos con vos para cumpleaños y eventos.",
    foto: fotos.arcoiris,
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
