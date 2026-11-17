// Blindajes: reglas del proyecto que tienen que seguir valiendo aunque nadie
// relea CLAUDE.md. Si uno falla, NO se toca la prueba: se arregla lo que la rompió.
// (Traído de San-F/web-plantilla.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const leer = (f) => readFileSync(f, "utf8");
const FLUJOS = readdirSync(".github/workflows")
  .filter((f) => f.endsWith(".yml"))
  .map((f) => `.github/workflows/${f}`);

test("las piezas de GitHub están fijadas por identificador y con permisos mínimos", () => {
  assert.ok(FLUJOS.length >= 4, "no se encontraron las automatizaciones");
  for (const f of FLUJOS) {
    const t = leer(f);
    for (const uso of t.match(/uses:\s*\S+/g) ?? [])
      assert.match(
        uso,
        /@[0-9a-f]{40}$/,
        `${f}: ${uso} tiene que ir fijado por identificador completo`,
      );
    assert.match(
      t,
      /^permissions:\n {2}(contents|issues): (read|write)/m,
      `${f}: falta declarar los permisos`,
    );
    assert.doesNotMatch(
      t,
      /pull_request_target|permissions:\s*write-all/,
      `${f}: patrón peligroso`,
    );
  }
});

// Mientras el sitio siga TAMBIÉN en Vercel, vercel.json tiene que dar las mismas
// cabeceras de seguridad que Cloudflare (public/_headers). Cuando se baje el
// proyecto de Vercel, se borra vercel.json y esta prueba deja de aplicar.
test("si existe vercel.json, sus cabeceras son las mismas que las de Cloudflare", (t) => {
  let vercel;
  try {
    vercel = JSON.parse(leer("vercel.json"));
  } catch {
    return t.skip("sin vercel.json");
  }
  const cloudflare = {};
  let ruta = null;
  for (const l of leer("public/_headers").split("\n")) {
    if (!l.trim() || l.startsWith("#")) continue;
    if (!l.startsWith(" ")) ruta = l.trim();
    else {
      const i = l.indexOf(":");
      (cloudflare[ruta] ??= {})[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
  }
  const equivalente = {
    "/(.*)": "/*",
    "/admin(.*)": "/admin",
    "/assets/(.*)": "/assets/*",
  };
  for (const bloque of vercel.headers) {
    const cf = cloudflare[equivalente[bloque.source]];
    assert.ok(
      cf,
      `vercel.json: ${bloque.source} no tiene par en public/_headers`,
    );
    const v = Object.fromEntries(bloque.headers.map((h) => [h.key, h.value]));
    assert.deepEqual(v, cf, `cabeceras distintas en ${bloque.source}`);
  }
  assert.equal(
    vercel.headers.length,
    3,
    "vercel.json tiene que cubrir todo, panel y assets",
  );
});
