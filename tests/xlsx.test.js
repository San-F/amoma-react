import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readSheet } from "read-excel-file/universal";
import { interpretarPlanilla } from "../src/admin/lib/importer.js";

test("lee un .xlsx real hecho con Excel/openpyxl", async () => {
  const buf = await readFile(
    new URL("./fixtures-catalogo.xlsx", import.meta.url),
  );
  const filas = await readSheet(new Blob([buf]));
  const { productos, errores } = interpretarPlanilla(filas, [
    { slug: "tortas", name: "Tortas" },
    { slug: "postres", name: "Tartas y postres" },
  ]);
  assert.deepEqual(errores, []);
  const lemon = productos.find((p) => p.slug === "lemon-pie");
  assert.equal(lemon.variants[0].price_cents, 1800000);
  assert.equal(lemon.variants[1].price_cents, 3200050);
  assert.equal(lemon.variants[0].servings, 8);
  const choco = productos.find((p) => p.slug === "chocotorta");
  assert.equal(choco.is_published, false);
  assert.equal(choco.variants[0].price_cents, 2500000);
});
