// Parte de las pruebas de navegador (npm run test:e2e). Las levanta
// tests/e2e/run.cjs, que arma la página y le pasa las direcciones.
const SITIO = process.env.E2E_SITIO || "http://localhost:4173";
const PANEL = process.env.E2E_PANEL || "http://localhost:4175";
const CAPTURAS =
  process.env.E2E_CAPTURAS ||
  require("path").join(__dirname, "../../.e2e/capturas");
require("fs").mkdirSync(CAPTURAS, { recursive: true });
// Prueba la ventana "Acomodá la foto" del panel contra un Supabase simulado.
const { chromium, devices } = require("playwright");
const fs = require("fs");
const L = require("./supabase-simulado.cjs");
const foto = fs.readFileSync(
  require("path").join(__dirname, "../../src/assets/img/torta-4.jpeg"),
);
let imagenes = [
  {
    id: "i1",
    product_id: "p1",
    storage_path: "productos/p1/charlotte.webp",
    alt_text: "Charlotte",
    width: 896,
    height: 1195,
    is_cover: true,
    sort_order: 0,
    focus_x: 50,
    focus_y: 50,
    zoom: 1,
  },
];
const parches = [];
let subidas = 0;
const producto = () => ({
  id: "p1",
  slug: "charlotte",
  name: "Charlotte",
  category_id: "c1",
  short_description: "",
  description: "",
  is_published: true,
  is_featured: false,
  sort_order: 1,
  badge: null,
  variants: [],
  images: imagenes,
});
let fallas = 0;
const ok = (c, m) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) fallas++;
};
(async () => {
  const b = await chromium.launch();
  for (const [nombre, disp] of [
    ["celular", devices["iPhone 15 Pro"]],
    ["compu", { viewport: { width: 1366, height: 800 } }],
  ]) {
    console.log(`\n=== ${nombre} ===`);
    imagenes = imagenes
      .map((i) => ({ ...i, focus_x: 50, focus_y: 50, zoom: 1 }))
      .slice(0, 1);
    parches.length = 0;
    const ctx = await b.newContext({ ...disp });
    await ctx.addInitScript(
      (s) => localStorage.setItem("sb-fake-auth-token", s),
      JSON.stringify(L.session),
    );
    const errs = [];
    await ctx.route("https://fake.supabase.co/**", async (r) => {
      const u = new URL(r.request().url());
      const m = r.request().method();
      if (m === "OPTIONS") return L.preflight(r);
      if (u.pathname.startsWith("/storage/v1/object/public/"))
        return r.fulfill({
          status: 200,
          contentType: "image/jpeg",
          body: foto,
          headers: { "access-control-allow-origin": "*" },
        });
      if (u.pathname.startsWith("/storage/v1/object/")) {
        subidas++;
        return L.json(r, { Key: u.pathname });
      }
      if (u.pathname === "/rest/v1/rpc/admin_status")
        return L.json(r, [{ is_member: true, has_mfa: true }]);
      if (u.pathname === "/rest/v1/categories")
        return L.json(r, [
          {
            id: "c1",
            slug: "tortas",
            name: "Tortas",
            is_published: true,
            sort_order: 1,
          },
        ]);
      if (u.pathname === "/rest/v1/products") return L.json(r, producto());
      if (u.pathname === "/rest/v1/product_images") {
        if (m === "PATCH") {
          const id = u.searchParams.get("id")?.replace("eq.", "");
          const body = JSON.parse(r.request().postData());
          parches.push(body);
          imagenes = imagenes.map((i) => (i.id === id ? { ...i, ...body } : i));
          return L.json(r, id ? [{ id }] : []);
        }
        if (m === "POST") {
          const body = JSON.parse(r.request().postData());
          const nueva = {
            id: "i2",
            sort_order: 1,
            focus_x: 50,
            focus_y: 50,
            zoom: 1,
            ...body,
          };
          imagenes = [...imagenes, nueva];
          return L.json(r, { id: "i2" });
        }
      }
      if (u.pathname.startsWith("/auth/v1/user"))
        return L.json(r, L.session.user);
      return L.json(r, []);
    });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    p.on(
      "console",
      (m) =>
        m.type() === "error" &&
        !m.text().includes("Failed to load resource") &&
        errs.push(m.text()),
    );
    await p.goto(PANEL + "/admin/productos/p1", { waitUntil: "networkidle" });
    await p.waitForTimeout(500);

    // 1. tocar la foto abre la ventana
    await p.getByRole("button", { name: "Acomodar esta foto" }).first().click();
    const d = p.locator("dialog.adm-encuadre");
    await d.waitFor();
    ok(await d.isVisible(), "tocar la foto abre 'Acomodá la foto'");
    const circulo = d.locator(".adm-encuadre__circulo");
    const caja = await circulo.boundingBox();
    // 2. arrastrar la foto hacia arriba (para subir la torta)
    await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await p.mouse.down();
    for (let i = 1; i <= 10; i++)
      await p.mouse.move(
        caja.x + caja.width / 2,
        caja.y + caja.height / 2 - i * 6,
      );
    await p.mouse.up();
    // 3. acercar con la barra
    await d.locator('input[type="range"]').fill("1.3");
    const estilo = await circulo.locator("img").getAttribute("style");
    console.log("    estilo en la ventana:", estilo);
    ok(
      /object-position: 50% (\d+(\.\d+)?)%/.test(estilo) &&
        Number(estilo.match(/50% ([\d.]+)%/)[1]) > 60,
      "arrastrar hacia arriba sube el punto de la foto",
    );
    ok(/scale\(1\.3\)/.test(estilo), "la barra acerca la foto");
    const chica = await d
      .locator(".adm-encuadre__chica img")
      .getAttribute("style");
    ok(chica === estilo, "la vista chica 'En la tarjeta' muestra lo mismo");
    // 4. teclado
    await circulo.focus();
    await p.keyboard.press("ArrowLeft");
    const tras = await circulo.locator("img").getAttribute("style");
    ok(tras !== estilo, "las flechas del teclado también mueven la foto");
    await p.screenshot({ path: `${CAPTURAS}/encuadre-${nombre}.png` });
    // 5. ancho y accesibilidad básica
    const ancho = await p.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    ok(ancho <= 0, `sin scroll lateral (${ancho})`);
    // 6. guardar
    await d.getByRole("button", { name: "Guardar" }).click();
    await d.waitFor({ state: "detached" });
    const ultimo = parches.at(-1);
    console.log("    guardado:", JSON.stringify(ultimo));
    ok(
      ultimo &&
        ultimo.zoom === 1.3 &&
        ultimo.focus_y > 60 &&
        ultimo.focus_x > 50,
      "guarda en la base el punto y el zoom",
    );
    const mini = await p
      .locator(".adm-ficha-foto__circulo img")
      .first()
      .getAttribute("style");
    ok(
      mini && mini.includes("scale(1.3)"),
      "la miniatura del panel queda con el nuevo encuadre",
    );
    // 7. cancelar no guarda
    await p.getByRole("button", { name: "Acomodar esta foto" }).first().click();
    await d.waitFor();
    await d.locator('input[type="range"]').fill("2.5");
    await d.getByRole("button", { name: "Cancelar" }).click();
    await d.waitFor({ state: "detached" });
    ok(parches.length === 1, "Cancelar no guarda nada");
    // 8. Centrar
    await p.getByRole("button", { name: "Acomodar esta foto" }).first().click();
    await d.waitFor();
    await d.getByRole("button", { name: "Centrar" }).click();
    ok(
      (await circulo.locator("img").getAttribute("style")) === null ||
        !(await circulo.locator("img").getAttribute("style")).includes("scale"),
      "Centrar vuelve a la foto entera centrada",
    );
    await p.keyboard.press("Escape");
    await d.waitFor({ state: "detached" });
    // 9. subir una foto nueva ("Cambiar foto") abre la ventana sola
    await p.getByRole("button", { name: "Cambiar foto" }).click();
    await p
      .locator('.adm-elegir input[type=file][accept="image/*"]')
      .setInputFiles(
        require("path").join(__dirname, "../../src/assets/img/chipa.jpg"),
      );
    await d.waitFor({ timeout: 8000 });
    ok(await d.isVisible(), "al subir una foto se abre sola para acomodarla");
    await d.getByRole("button", { name: "Cancelar" }).click();
    ok(errs.length === 0, `sin errores de consola ${errs.join(" | ")}`);
    await ctx.close();
  }
  await b.close();
  console.log(`\nFALLAS=${fallas}`);
  process.exit(fallas ? 1 : 0);
})();
