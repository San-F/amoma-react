import { test } from "node:test";
import assert from "node:assert/strict";
import { qrSeguro } from "../src/admin/lib/qr.js";

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>';

test("re-codifica el QR crudo de Supabase (con #)", () => {
  const r = qrSeguro(`data:image/svg+xml;utf-8,${svg}`);
  assert.ok(r.startsWith("data:image/svg+xml;charset=utf-8,"));
  assert.ok(!r.includes("#"));
  assert.equal(decodeURIComponent(r.split(",")[1]), svg);
});

test("deja bien un QR ya codificado", () => {
  const r = qrSeguro(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
  assert.equal(decodeURIComponent(r.split(",")[1]), svg);
});
