import { test } from "node:test";
import assert from "node:assert/strict";
import { aWhatsApp } from "../src/lib/telefono.js";

test("teléfonos argentinos a formato WhatsApp", () => {
  assert.equal(aWhatsApp("11 5555-1234"), "5491155551234");
  assert.equal(aWhatsApp("011 5555 1234"), "5491155551234");
  assert.equal(aWhatsApp("+54 9 11 5555 1234"), "5491155551234");
  assert.equal(aWhatsApp("+54 11 5555 1234"), "5491155551234");
  assert.equal(aWhatsApp("11 15 5555 1234"), "5491155551234");
  assert.equal(aWhatsApp("0054 9 11 5555 1234"), "5491155551234");
  assert.equal(aWhatsApp("5491136362466"), "5491136362466");
});
