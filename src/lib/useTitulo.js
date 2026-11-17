import { useEffect } from "react";
import { SITIO_URL } from "../data/direccion.js";

const SITIO = "Amoma · Tortas caseras en Villa Pueyrredón, CABA";
const DESCRIPCION =
  "Pastelería casera en Villa Pueyrredón, CABA. Tortas, tartas, postres y tortas personalizadas para cumpleaños y eventos. Encargos por WhatsApp.";

function meta(selector, crear, valor) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = crear();
    document.head.appendChild(el);
  }
  el.setAttribute(el.tagName === "LINK" ? "href" : "content", valor);
}

// Título, descripción y dirección oficial (canonical) propios de cada página.
// La canónica usa SIEMPRE la dirección publicada (src/data/direccion.js), no
// la dirección desde donde se abrió: si la misma página está en otro hosting
// (o en una copia vieja), Google tiene que saber cuál es la oficial.
export function useTitulo(titulo, descripcion = DESCRIPCION) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Amoma` : SITIO;
    meta(
      'meta[name="description"]',
      () =>
        Object.assign(document.createElement("meta"), { name: "description" }),
      descripcion,
    );
    meta(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement("link"), { rel: "canonical" }),
      SITIO_URL + window.location.pathname,
    );
  }, [titulo, descripcion]);
}
