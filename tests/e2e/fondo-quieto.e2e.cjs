// Parte de las pruebas de navegador (npm run test:e2e). Las levanta
// tests/e2e/run.cjs, que arma la página y le pasa las direcciones.
const SITIO = process.env.E2E_SITIO || "http://localhost:4173";
const PANEL = process.env.E2E_PANEL || "http://localhost:4175";
const CAPTURAS =
  process.env.E2E_CAPTURAS ||
  require("path").join(__dirname, "../../.e2e/capturas");
require("fs").mkdirSync(CAPTURAS, { recursive: true });
const { chromium, devices } = require("playwright");
(async () => {
  const b = await chromium.launch();
  let fallas = 0;
  for (const [n, d] of [
    ["iphone", devices["iPhone 15 Pro"]],
    ["compu", { viewport: { width: 1366, height: 800 } }],
  ]) {
    const ctx = await b.newContext({ ...d, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(SITIO + "/");
    await p.evaluate(() =>
      document.querySelector(".catalogo").scrollIntoView(),
    );
    await p.waitForTimeout(600);
    const y0 = await p.evaluate(() => scrollY);
    await p.locator(".sabor__btn").first().click();
    await p.waitForTimeout(800);
    const x0 = await p.evaluate(
      () => document.querySelector(".sabor__btn").getBoundingClientRect().left,
    );
    // intentar scrollear la página de atrás (rueda / dedo sobre el fondo)
    await p.mouse.move(5, 5);
    if (n === "compu") await p.mouse.wheel(0, 1500);
    else
      await p.evaluate(() => {
        window.scrollBy(0, 0);
      });
    await p.evaluate(() => (document.scrollingElement.scrollTop += 0));
    await p.waitForTimeout(500);
    const y1 = await p.evaluate(() => scrollY);
    const ov = await p.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    );
    console.log(n, "abierto: scroll", y0, "→", y1, "overflow html:", ov);
    if (y1 !== y0 || ov !== "hidden") fallas++;
    await p.keyboard.press("Escape");
    await p.waitForTimeout(600);
    const y2 = await p.evaluate(() => scrollY);
    const ov2 = await p.evaluate(
      () => getComputedStyle(document.documentElement).overflowY,
    );
    console.log(n, "cerrado: misma posición", y2 === y0, "overflow:", ov2);
    if (y2 !== y0 || ov2 === "hidden") fallas++;
    if (n === "compu") {
      await p.mouse.wheel(0, 600);
      await p.waitForTimeout(500);
      const y3 = await p.evaluate(() => scrollY);
      console.log("compu: vuelve a scrollear", y3 > y2);
      if (!(y3 > y2)) fallas++;
    }
    await ctx.close();
  }
  await b.close();
  console.log("FALLAS=" + fallas);
  process.exit(fallas ? 1 : 0);
})();
