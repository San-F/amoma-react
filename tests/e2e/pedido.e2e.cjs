// Parte de las pruebas de navegador (npm run test:e2e). Las levanta
// tests/e2e/run.cjs, que arma la página y le pasa las direcciones.
const SITIO = process.env.E2E_SITIO || "http://localhost:4173";
const PANEL = process.env.E2E_PANEL || "http://localhost:4175";
const CAPTURAS =
  process.env.E2E_CAPTURAS ||
  require("path").join(__dirname, "../../.e2e/capturas");
require("fs").mkdirSync(CAPTURAS, { recursive: true });
const { chromium, devices } = require("playwright");
const fs = require("fs");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const URL = SITIO + "/";
const SH = CAPTURAS;
let fallas = 0;
const ok = (c, msg) => {
  console.log(`${c ? "✓" : "✗"} ${msg}`);
  if (!c) fallas++;
};

async function abrirProducto(page, nombre, tamano) {
  await page.locator(".sabor__btn", { hasText: nombre }).first().click();
  const d = page.locator("dialog.detalle[open]");
  await d.waitFor();
  if (tamano)
    await d
      .locator("label.tamano", { hasText: new RegExp(`^${tamano}`) })
      .first()
      .click();
  return d;
}
async function agregar(page, nombre, tamano) {
  const d = await abrirProducto(page, nombre, tamano);
  await d.locator(".detalle__seguir").click();
  await page.waitForFunction(
    () => !document.querySelector("dialog.detalle")?.open,
  );
}
const hoja = (page) => page.locator("dialog.pedido");
const lineas = (page) =>
  hoja(page)
    .locator(".pedido__item")
    .evaluateAll((els) =>
      els.map(
        (e) =>
          `${e.querySelector(".pedido__cantidad span").textContent} ${e.querySelector(".pedido__nombre").textContent} ${e.querySelector("select")?.value ?? e.querySelector(".pedido__variante,.pedido__aviso")?.textContent ?? ""}`,
      ),
    );
const mensaje = async (page) => {
  const href = await hoja(page).locator(".pedido__enviar").getAttribute("href");
  return decodeURIComponent(href.split("text=")[1]);
};

async function correr(nombreDisp, opciones) {
  console.log(`\n=== ${nombreDisp} ===`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...opciones,
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  await page.goto(URL);
  await page.evaluate(() =>
    document.querySelector("#catalogo")?.scrollIntoView(),
  );
  await page.waitForTimeout(800);

  // 1. mismo producto en dos tamaños + otro en el medio
  await agregar(page, "Torta de frutos rojos", "Chica");
  await agregar(page, "Chipá", "Docena");
  await agregar(page, "Torta de frutos rojos", "Grande");
  const d = await abrirProducto(page, "Torta de frutos rojos", "Chica");
  ok(
    (await d.locator(".detalle__ya").textContent()).includes(
      "1 Chica · 1 Grande",
    ),
    "el detalle avisa lo que ya tenés en el pedido",
  );
  // 2. doble/triple toque rápido en "Agregar" suma uno solo
  await d.locator(".detalle__seguir").click({ clickCount: 3, delay: 20 });
  await page.waitForFunction(
    () => !document.querySelector("dialog.detalle")?.open,
  );
  // 3. abrir y cerrar rápido, y abrir otro: el segundo no se cierra solo
  const d2 = await abrirProducto(page, "Lemon pie");
  await d2.locator(".detalle__seguir").click();
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector("dialog.detalle")?.open,
  );
  const d3 = await abrirProducto(page, "Charlotte");
  await page.waitForTimeout(900);
  ok(await d3.isVisible(), "abrir otro producto enseguida: no se cierra solo");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await page.locator(".pedido-pastilla").click();
  await hoja(page).waitFor();
  let l = await lineas(page);
  console.log("   ", l.join(" | "));
  ok(
    l[0].startsWith("2 Torta de frutos rojos Chica") &&
      l[1].startsWith("1 Torta de frutos rojos Grande"),
    "chica y grande en dos líneas, juntas (triple toque = +1)",
  );
  ok(
    l.some((x) => x.includes("Chipá")) &&
      l.some((x) => x.includes("Lemon pie")),
    "chipá y lemon pie en el pedido",
  );
  let m = await mensaje(page);
  ok(
    /2 × Torta de frutos rojos \(Chica\) — \$\s?56\.000/.test(m),
    "precio x cantidad bien (2 chicas = $56.000)",
  );

  // 4. cambiar Chica → Grande: se juntan (2+1 = 3)
  await hoja(page)
    .locator(".pedido__item")
    .first()
    .locator("select")
    .selectOption("Grande");
  l = await lineas(page);
  ok(
    l[0].startsWith("3 Torta de frutos rojos Grande") &&
      !l.some((x) => x.includes("rojos Chica")),
    "cambiar a un tamaño que ya estaba junta las cantidades",
  );
  m = await mensaje(page);
  ok(
    /3 × Torta de frutos rojos \(Grande\) — \$\s?168\.000/.test(m),
    "mensaje con el precio del tamaño nuevo",
  );

  // 5. tocar + 120 veces → tope 99 y botón apagado
  const mas = hoja(page)
    .locator(".pedido__item")
    .nth(1)
    .getByRole("button", { name: /Uno más/ });
  for (let i = 0; i < 120 && (await mas.isEnabled()); i++)
    await mas.click({ delay: 0 });
  l = await lineas(page);
  ok(l[1].startsWith("99 "), "tope de 99 unidades");
  ok(await mas.isDisabled(), "el + se apaga en 99");
  // 6. bajar con − hasta quitar, y deshacer
  const menos = hoja(page)
    .locator(".pedido__item")
    .nth(1)
    .getByRole("button", { name: /Uno menos|Quitar/ });
  for (let i = 0; i < 99; i++) await menos.click();
  ok(
    !(await lineas(page)).some((x) => x.includes("Chipá")),
    "con − hasta cero se quita el producto",
  );
  await hoja(page).getByRole("button", { name: "Deshacer" }).click();
  l = await lineas(page);
  ok(l[1]?.startsWith("1 Chipá"), "Deshacer lo devuelve a su lugar");

  // 7. mezcla con y sin precio (lemon pie no tiene precio de ejemplo? ver)
  const totalTxt = await hoja(page).locator(".pedido__total").innerText();
  console.log("    total:", totalTxt.replace(/\n/g, " "));
  // 8. fecha con poca anticipación
  const hoy = new Date().toISOString().slice(0, 10);
  await hoja(page).locator('input[name="fecha"]').fill(hoy);
  ok(
    await hoja(page)
      .getByText(/menos de 2 días/)
      .isVisible(),
    "aviso si la fecha es muy pronto",
  );
  await hoja(page).locator('input[name="nombre"]').fill("Ana");
  await page.screenshot({ path: `${SH}/t-${nombreDisp}-hoja.png` });

  // 9. desborde lateral, accesibilidad
  const ancho = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  ok(ancho <= 0, `sin scroll lateral (${ancho})`);
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(async () =>
    (await axe.run(document.querySelector("dialog.pedido"))).violations.map(
      (v) => v.id,
    ),
  );
  ok(axe.length === 0, `accesibilidad de la hoja sin errores ${axe.join(",")}`);

  // 10. otra pestaña: cambia en una y se ve en la otra
  const otra = await ctx.newPage();
  await otra.goto(URL);
  await otra.locator(".pedido-pastilla").waitFor();
  await hoja(page)
    .locator(".pedido__item")
    .nth(1)
    .getByRole("button", { name: /Uno más/ })
    .click();
  await page.waitForTimeout(300);
  ok(
    (await otra.locator(".pedido-pastilla__cant").textContent()) ===
      (await page.locator(".pedido-pastilla__cant").textContent()),
    "dos pestañas quedan sincronizadas",
  );
  await otra.close();

  // 11. guardado viejo: producto que ya no existe y tamaño que ya no existe
  await page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem("amoma-pedido"));
    g.push({
      clave: "brownie::Grande",
      id: "brownie",
      nombre: "Brownie",
      variante: "Grande",
      precio: 999,
      cantidad: 2,
    });
    g.push({
      clave: "chipa::Bolsa",
      id: "chipa",
      nombre: "Chipá",
      variante: "Bolsa",
      precio: 1,
      cantidad: 1,
    });
    localStorage.setItem("amoma-pedido", JSON.stringify(g));
  });
  await page.reload();
  await page.locator(".pedido-pastilla").click();
  await hoja(page).waitFor();
  ok(
    await hoja(page).getByText("Ya no está disponible").isVisible(),
    "producto borrado: avisa 'Ya no está disponible'",
  );
  ok(
    await hoja(page)
      .getByText(/2 productos necesitan que los revises/)
      .isVisible(),
    "avisa cuántos hay que revisar",
  );
  m = await mensaje(page);
  ok(
    !m.includes("Brownie") && !m.includes("Bolsa"),
    "lo que no está disponible no va al mensaje",
  );
  const bolsa = hoja(page).locator(".pedido__item.is-problema select");
  await bolsa.selectOption("Media docena");
  m = await mensaje(page);
  ok(m.includes("Chipá (Media docena)"), "elegir otro tamaño lo arregla");
  await page.screenshot({ path: `${SH}/t-${nombreDisp}-avisos.png` });
  console.log(
    "    MENSAJE:\n" +
      m
        .split("\n")
        .map((x) => "      " + x)
        .join("\n"),
  );

  // 12b. "Pedir ahora" con cantidad 3: suma 3 y abre la hoja directo
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const dd = await abrirProducto(page, "Chocolate y rosetas", "Grande");
  const precio1 = await dd.locator(".detalle__precio").innerText();
  await dd.getByRole("button", { name: "Uno más" }).click();
  await dd.getByRole("button", { name: "Uno más" }).click();
  const precio3 = await dd.locator(".detalle__precio").innerText();
  console.log("    precio en vivo:", precio1, "→", precio3);
  await page.screenshot({ path: `${SH}/t-${nombreDisp}-detalle.png` });
  await dd.getByRole("button", { name: "Pedir ahora" }).click();
  await hoja(page).waitFor({ state: "visible", timeout: 3000 });
  l = await lineas(page);
  ok(
    l.some((x) => x.startsWith("3 Chocolate y rosetas Grande")),
    "Pedir ahora: suma la cantidad elegida y abre la hoja",
  );

  // 12. quitar todo uno por uno: la última se puede deshacer y después se cierra
  while ((await hoja(page).locator(".pedido__item").count()) > 0) {
    await hoja(page)
      .locator(".pedido__item")
      .first()
      .getByRole("button", { name: /Quitar|Uno menos/ })
      .click();
  }
  ok(
    await hoja(page).getByRole("button", { name: "Deshacer" }).isVisible(),
    "al quitar el último, todavía se puede deshacer",
  );
  await page.waitForTimeout(5600);
  ok(
    !(await hoja(page)
      .isVisible()
      .catch(() => false)) &&
      (await page.locator(".pedido-pastilla").count()) === 0,
    "sin productos: se cierra y desaparece la pastilla",
  );

  ok(errores.length === 0, `sin errores de consola ${errores.join(" | ")}`);
  await browser.close();
}

(async () => {
  fs.mkdirSync(SH, { recursive: true });
  await correr("iphone", devices["iPhone 15 Pro"]);
  await correr("compu", { viewport: { width: 1366, height: 800 } });
  console.log(`\nFALLAS=${fallas}`);
  process.exit(fallas ? 1 : 0);
})();
