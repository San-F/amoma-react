// Pieza del armado: la dirección del sitio se escribe una sola vez
// (src/data/direccion.js) y acá se completa donde hace falta:
//  - index.html: cada %SITIO_URL%
//  - robots.txt, sitemap.xml y llms.txt: salen de publico-con-direccion/
// Si queda un %SITIO_URL% sin completar o la dirección no es https, el armado falla.
import fs from "node:fs";
import path from "node:path";

const MARCA = /%SITIO_URL%/g;
const CARPETA = "publico-con-direccion";

export function completar(texto, url) {
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/.test(url))
    throw new Error(
      `La dirección del sitio tiene que ser https://dominio, sin barra final (es "${url}")`,
    );
  const listo = texto.replace(MARCA, url);
  if (/%[A-Z_]+%/.test(listo))
    throw new Error("Quedó un %MARCADOR% sin completar");
  return listo;
}

export function archivosConDireccion(url, carpeta = CARPETA) {
  const archivos = {};
  for (const nombre of fs.readdirSync(carpeta))
    archivos[nombre] = completar(
      fs.readFileSync(path.join(carpeta, nombre), "utf8"),
      url,
    );
  return archivos;
}

const TIPOS = {
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

export default function direccion(url) {
  return {
    name: "direccion-del-sitio",
    transformIndexHtml: (html) => completar(html, url),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const nombre = (req.url || "").split("?")[0].slice(1);
        const archivos = archivosConDireccion(url);
        if (!(nombre in archivos)) return next();
        res.setHeader("Content-Type", TIPOS[path.extname(nombre)]);
        res.end(archivos[nombre]);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(
        archivosConDireccion(url),
      ))
        this.emitFile({ type: "asset", fileName, source });
    },
  };
}
