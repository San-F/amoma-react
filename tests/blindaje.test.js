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
