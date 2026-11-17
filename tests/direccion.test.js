// La dirección del sitio se escribe en UN solo lugar (src/data/direccion.js) y
// el armado la completa en index.html, robots.txt, sitemap.xml y llms.txt.
// (Antes estaba en 5 archivos y todos quedaron apuntando al hosting viejo.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITIO_URL } from "../src/data/direccion.js";
import { archivosConDireccion, completar } from "../scripts/vite-direccion.js";

test("la dirección del sitio es https y sin barra final", () => {
  assert.match(SITIO_URL, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/);
});

test("robots, sitemap y llms salen con la dirección y sin marcadores", () => {
  const a = archivosConDireccion(SITIO_URL);
  assert.deepEqual(Object.keys(a).sort(), [
    "llms.txt",
    "robots.txt",
    "sitemap.xml",
  ]);
  assert.match(
    a["robots.txt"],
    new RegExp(`Sitemap: ${SITIO_URL}/sitemap.xml`),
  );
  assert.match(a["robots.txt"], /Disallow: \/admin/);
  const locs = [...a["sitemap.xml"].matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  assert.ok(locs.length >= 4);
  for (const l of locs) assert.ok(l.startsWith(`${SITIO_URL}/`), l);
  for (const t of Object.values(a)) assert.doesNotMatch(t, /%[A-Z_]+%/);
});

test("index.html: canónica, vista previa y ficha de Google usan la dirección", () => {
  const html = completar(readFileSync("index.html", "utf8"), SITIO_URL);
  for (const re of [
    /rel="canonical" href="([^"]+)"/,
    /property="og:url" content="([^"]+)"/,
    /property="og:image"\s+content="([^"]+)"/,
    /"url": "([^"]+)"/,
  ])
    assert.ok(re.exec(html)?.[1].startsWith(`${SITIO_URL}/`), String(re));
});

test("completar: rechaza una dirección mal escrita o un marcador desconocido", () => {
  for (const mala of [
    "http://amoma.com.ar",
    "https://amoma.com.ar/",
    "amoma.com.ar",
    "",
  ])
    assert.throws(() => completar("%SITIO_URL%", mala), /https/);
  assert.throws(
    () => completar("%SITIO_URL% %OTRO%", SITIO_URL),
    /sin completar/,
  );
});

test("la dirección no está escrita a mano en ningún otro archivo", () => {
  const dominio = new URL(SITIO_URL).host;
  const revisar = (dir) =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? revisar(p) : [p];
    });
  const archivos = [
    "index.html",
    ...revisar("public"),
    ...revisar("publico-con-direccion"),
    ...revisar("src"),
  ].filter((f) => /\.(html|txt|xml|js|jsx|json|webmanifest)$/.test(f));
  const con = archivos.filter((f) => {
    if (f === join("src", "data", "direccion.js")) return false;
    const t = readFileSync(f, "utf8");
    return t.includes(dominio) || /[a-z0-9-]+\.vercel\.app/.test(t);
  });
  assert.deepEqual(con, [], "usar %SITIO_URL% o importar SITIO_URL");
});
