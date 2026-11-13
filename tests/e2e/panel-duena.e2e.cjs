// Parte de las pruebas de navegador (npm run test:e2e).
// "Un día de la dueña": cambia precios, oculta, pone fotos, usa el Excel, y
// se mira la página como la ve un cliente. Contra un Supabase SIMULADO con
// memoria (las reglas reales de la base se prueban en supabase/tests).
const PANEL = process.env.E2E_PANEL || "http://localhost:4175";
const CAPTURAS =
  process.env.E2E_CAPTURAS ||
  require("path").join(__dirname, "../../.e2e/capturas");
require("fs").mkdirSync(CAPTURAS, { recursive: true });
const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");
const L = require("./supabase-simulado.cjs");
const foto = fs.readFileSync(
  path.join(__dirname, "../../src/assets/img/torta-10.jpeg"),
);

let fallas = 0;
const ok = (c, m) => {
  console.log(`${c ? "✓" : "✗"} ${m}`);
  if (!c) fallas++;
};

// ---------- base simulada ----------
function baseNueva() {
  return {
    categorias: [
      { id: "c1", slug: "tortas", name: "Tortas", sort_order: 1 },
      { id: "c2", slug: "postres", name: "Tartas y postres", sort_order: 2 },
    ],
    productos: [
      {
        id: "p1",
        slug: "lemon-pie",
        name: "Lemon pie",
        category_id: "c2",
        short_description: "Masa sablé, crema de limón y merengue.",
        description: null,
        badge: null,
        is_published: true,
        is_featured: false,
        sort_order: 1,
        variants: [
          { label: "Chica", servings: 8, price_cents: 1900000, sort_order: 0 },
          {
            label: "Grande",
            servings: 14,
            price_cents: 3000000,
            sort_order: 1,
            is_available: true,
          },
        ],
        images: [
          {
            id: "i1",
            storage_path: "productos/p1/a.webp",
            alt_text: "Lemon pie",
            width: 800,
            height: 800,
            is_cover: true,
            sort_order: 0,
            focus_x: 50,
            focus_y: 50,
            zoom: 1,
          },
        ],
      },
      {
        id: "p2",
        slug: "charlotte",
        name: "Charlotte",
        category_id: "c1",
        short_description: "Vainillas y mousse.",
        description: null,
        badge: null,
        is_published: true,
        is_featured: false,
        sort_order: 2,
        variants: [
          { label: "Chica", servings: 10, price_cents: 3000000, sort_order: 0 },
        ],
        images: [], // sin foto
      },
    ],
    llamadas: [],
    rechazarCambios: false, // simula "la base no cambió nada" (0 filas)
  };
}

function atender(db) {
  const conCategoria = (p) => {
    const c = db.categorias.find((x) => x.id === p.category_id);
    return { ...p, category: c ? { slug: c.slug, name: c.name } : null };
  };
  return async (r) => {
    const req = r.request();
    const u = new URL(req.url());
    const m = req.method();
    const q = u.searchParams;
    if (m === "OPTIONS") return L.preflight(r);
    const cuerpo = () => JSON.parse(req.postData() || "{}");
    const id = (q.get("id") || "").replace("eq.", "");

    if (u.pathname.startsWith("/storage/v1/object/public/"))
      return r.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: foto,
        headers: { "access-control-allow-origin": "*" },
      });
    if (u.pathname.startsWith("/storage/v1/object/")) {
      db.llamadas.push(["subida", u.pathname]);
      return L.json(r, { Key: u.pathname });
    }
    if (u.pathname.startsWith("/auth/v1/user"))
      return L.json(r, L.session.user);
    if (u.pathname === "/rest/v1/rpc/admin_status")
      return L.json(r, [{ is_member: true, has_mfa: true }]);
    if (u.pathname === "/rest/v1/categories") return L.json(r, db.categorias);
    if (u.pathname === "/rest/v1/site_settings")
      return L.json(r, { id: 1, whatsapp: "5491136362466" });
    if (u.pathname === "/rest/v1/gallery_items") return L.json(r, []);
    if (u.pathname === "/rest/v1/inquiries")
      return L.json(r, [], 200, { "content-range": "*/0" });

    if (u.pathname === "/rest/v1/rpc/admin_save_product") {
      const { payload } = cuerpo();
      db.llamadas.push(["guardar", payload]);
      const p = db.productos.find((x) => x.id === payload.id);
      if (!p)
        return L.json(
          r,
          { code: "22023", message: "El producto ya no existe." },
          400,
        );
      const { variants, id: _i, slug: _s, ...campos } = payload;
      Object.assign(p, campos, {
        variants: variants.map((v, i) => ({
          ...v,
          sort_order: i,
          is_available: true,
        })),
      });
      return L.json(r, p.id);
    }
    if (u.pathname === "/rest/v1/rpc/admin_import_catalog") {
      const { payload } = cuerpo();
      db.llamadas.push(["importar", payload]);
      let creados = 0,
        actualizados = 0,
        variantes = 0;
      for (const it of payload.products) {
        let p = db.productos.find((x) => x.slug === it.slug);
        const cat = db.categorias.find((c) => c.slug === it.category_slug);
        if (!p) {
          p = {
            id: "n" + db.productos.length,
            slug: it.slug,
            category_id: null,
            description: null,
            badge: null,
            is_featured: false,
            is_published: true,
            sort_order: db.productos.length + 1,
            images: [],
          };
          db.productos.push(p);
          creados++;
        } else actualizados++;
        p.name = it.name;
        if (cat) p.category_id = cat.id;
        if (it.short_description) p.short_description = it.short_description;
        if (it.is_published != null) p.is_published = it.is_published;
        p.variants = it.variants.map((v, i) => ({
          ...v,
          sort_order: i,
          is_available: true,
        }));
        variantes += it.variants.length;
      }
      return L.json(r, { creados, actualizados, variantes });
    }

    if (u.pathname === "/rest/v1/products") {
      if (m === "PATCH") {
        db.llamadas.push(["producto", id, cuerpo()]);
        if (db.rechazarCambios) return L.json(r, []);
        const p = db.productos.find((x) => x.id === id);
        if (cuerpo().is_published && !p.variants.length)
          return L.json(
            r,
            {
              code: "22023",
              message: "Para publicarlo, cargá al menos un precio.",
            },
            400,
          );
        Object.assign(p, cuerpo());
        return L.json(r, [{ id }]);
      }
      if (id) {
        const p = db.productos.find((x) => x.id === id);
        return p ? L.json(r, conCategoria(p)) : L.json(r, {}, 406);
      }
      let lista = db.productos;
      if (q.get("is_published") === "eq.true")
        lista = lista.filter((p) => p.is_published);
      return L.json(
        r,
        [...lista]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(conCategoria),
      );
    }
    if (u.pathname === "/rest/v1/product_images") {
      if (m === "POST") {
        const b = cuerpo();
        db.llamadas.push(["foto", b]);
        const p = db.productos.find((x) => x.id === b.product_id);
        const nueva = {
          id: "i" + Date.now(),
          sort_order: 0,
          focus_x: 50,
          focus_y: 50,
          zoom: 1,
          ...b,
        };
        p.images.push(nueva);
        return L.json(r, { id: nueva.id });
      }
      return L.json(r, []);
    }
    return L.json(r, []);
  };
}

(async () => {
  const b = await chromium.launch();
  for (const [nombre, disp] of [
    ["celular", devices["iPhone 15 Pro"]],
    ["compu", { viewport: { width: 1366, height: 800 } }],
  ]) {
    console.log(`\n=== ${nombre} ===`);
    const db = baseNueva();
    const errs = [];
    const nuevoContexto = async (conSesion) => {
      const ctx = await b.newContext({ ...disp, acceptDownloads: true });
      if (conSesion)
        await ctx.addInitScript(
          (s) => localStorage.setItem("sb-fake-auth-token", s),
          JSON.stringify(L.session),
        );
      await ctx.addInitScript(() =>
        sessionStorage.setItem("amoma-splash", "1"),
      );
      await ctx.route("https://fake.supabase.co/**", atender(db));
      const p = await ctx.newPage();
      p.on("pageerror", (e) => errs.push(e.message));
      p.on(
        "console",
        (m) =>
          m.type() === "error" &&
          !m.text().includes("Failed to load resource") &&
          !m.text().includes("Loading the font") &&
          // rechazos que la prueba provoca a propósito (el panel los anota)
          !m.text().includes("22023") &&
          !m.text().includes("0 filas") &&
          errs.push(m.text()),
      );
      return p;
    };
    const captura = (pag, que) =>
      pag.screenshot({
        path: path.join(CAPTURAS, `duena-${nombre}-${que}.png`),
        fullPage: true,
      });
    const panel = await nuevoContexto(true);
    const cliente = await nuevoContexto(false);
    // lo que ve un cliente en el catálogo de la página
    const enLaPagina = async (pag = cliente) => {
      await pag.goto(PANEL + "/", { waitUntil: "networkidle" });
      await pag.waitForTimeout(400);
      return pag.locator("#tortas").innerText();
    };

    // 1. la lista avisa lo que no se ve
    await panel.goto(PANEL + "/admin/productos", { waitUntil: "networkidle" });
    ok(
      await panel.getByText("Hay 1 producto sin foto").isVisible(),
      "la lista avisa que hay un producto sin foto (no se ve en la página)",
    );
    await captura(panel, "sin-foto");
    let pagina = await enLaPagina();
    ok(
      pagina.includes("Lemon pie") && !pagina.includes("Charlotte"),
      "en la página: se ve el que tiene foto y no el que no tiene",
    );
    ok(
      !pagina.includes("frutos rojos"),
      "la página no mezcla productos de muestra con los de la base",
    );

    // 2. cambiar un precio
    await panel.getByRole("link", { name: "Lemon pie" }).click();
    await panel.getByRole("textbox", { name: "Precio 1" }).fill("21.000");
    await panel.getByRole("button", { name: "Guardar" }).click();
    await panel.getByText("Guardado ✓").waitFor();
    const guardado = db.llamadas.filter((l) => l[0] === "guardar").at(-1)[1];
    ok(
      guardado.variants[0].price_cents === 2100000 &&
        guardado.variants.length === 2 &&
        !("slug" in guardado),
      "cambiar un precio: una sola operación, con los 2 tamaños y sin tocar el identificador",
    );
    pagina = await enLaPagina();
    ok(pagina.includes("21.000"), "el precio nuevo aparece en la página");
    await captura(panel, "producto");

    // 3. ponerle la foto al que no tiene, tocando "+ Foto"
    await panel.goto(PANEL + "/admin/productos", { waitUntil: "networkidle" });
    await panel.getByLabel("Poner foto a Charlotte").setInputFiles({
      name: "IMG_4471.jpeg",
      mimeType: "image/jpeg",
      buffer: foto,
    });
    await panel
      .getByText("Hay 1 producto sin foto")
      .waitFor({ state: "detached" });
    ok(
      db.llamadas.some((l) => l[0] === "subida") &&
        db.llamadas.some(
          (l) => l[0] === "foto" && l[1].product_id === "p2" && l[1].is_cover,
        ),
      "'+ Foto' sube la foto y la deja de portada (sin importar el nombre del archivo)",
    );
    pagina = await enLaPagina();
    ok(
      pagina.includes("Charlotte"),
      "con foto, el producto ya aparece en la página",
    );

    // 4. ocultar desde la lista
    await captura(panel, "lista");
    const filaLemon = panel.locator("li.adm-fila", { hasText: "Lemon pie" });
    await filaLemon.locator("input[type=checkbox]").click();
    await filaLemon.getByText("Oculto").waitFor();
    pagina = await enLaPagina();
    ok(!pagina.includes("Lemon pie"), "ocultar: el cliente deja de verlo");
    ok(
      !(await enLaPagina(panel)).includes("Lemon pie"),
      "ocultar: la dueña, con su sesión abierta, tampoco lo ve en la página",
    );

    // 5. Excel: bajar lo cargado, cambiar un precio, subirlo
    await panel.goto(PANEL + "/admin/importar", { waitUntil: "networkidle" });
    const [bajada] = await Promise.all([
      panel.waitForEvent("download"),
      panel.getByRole("button", { name: "Descargar mi catálogo" }).click(),
    ]);
    const csv = fs.readFileSync(await bajada.path(), "utf8");
    ok(
      csv.includes("Lemon pie;Tartas y postres") &&
        csv.includes("Chica;8;21000;no;lemon-pie") &&
        csv.includes("Charlotte;Tortas"),
      "la planilla descargada trae lo cargado (precio nuevo, oculto = no)",
    );
    const editado =
      csv
        .replace("Chica;8;21000;no;lemon-pie", "Chica;8;23500;;lemon-pie")
        .replace(
          "Lemon pie;Tartas y postres",
          "Lemon pie clásico;Tartas y postres",
        ) + "\r\nTorta nueva;Tortas;Recién salida;Única;;40000;;";
    await panel.locator('input[type=file][accept=".xlsx,.csv"]').setInputFiles({
      name: "amoma-catalogo.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(editado, "utf8"),
    });
    await panel.getByText("Vista previa").waitFor();
    await captura(panel, "excel");
    ok(
      !(await panel.locator(".adm-bloque .adm-error").count()),
      "la planilla editada se lee sin errores",
    );
    await panel.getByRole("button", { name: /Importar 3 producto/ }).click();
    await panel.getByText(/1 nuevo\(s\), 2\s+actualizado\(s\)/).waitFor();
    const lemon = db.productos.find((p) => p.slug === "lemon-pie");
    ok(
      lemon.name === "Lemon pie clásico" &&
        lemon.variants[0].price_cents === 2350000 &&
        db.productos.length === 3,
      "Excel: cambia nombre y precio del mismo producto (sin duplicar) y agrega el nuevo",
    );
    ok(
      lemon.is_published === false,
      "Excel: lo que estaba oculto sigue oculto",
    );
    ok(
      await panel.getByRole("link", { name: "Ponerles foto →" }).isVisible(),
      "después de importar, lleva a ponerle foto a los nuevos",
    );

    // 6. mostrar algo sin precio: la base dice que no y el panel lo cuenta
    db.productos.find((p) => p.slug === "torta-nueva").variants = [];
    db.productos.find((p) => p.slug === "torta-nueva").is_published = false;
    await panel.goto(PANEL + "/admin/productos", { waitUntil: "networkidle" });
    await panel
      .locator("li.adm-fila", { hasText: "Torta nueva" })
      .locator("input[type=checkbox]")
      .click();
    await panel
      .getByText("Para publicarlo, cargá al menos un precio.")
      .waitFor({ timeout: 5000 })
      .catch(() => {});
    ok(
      await panel
        .getByText("Para publicarlo, cargá al menos un precio.")
        .isVisible(),
      "no deja mostrar un producto sin precio y explica por qué",
    );

    // 7. si la base no cambió nada, el panel no dice que guardó
    db.rechazarCambios = true;
    await panel
      .locator("li.adm-fila", { hasText: "Charlotte" })
      .locator("input[type=checkbox]")
      .click();
    await panel.getByText(/No se pudo cambiar la visibilidad/).waitFor();
    ok(true, "si la base rechaza el cambio en silencio, el panel avisa");
    db.rechazarCambios = false;

    // 8. todo oculto: la página queda vacía, no vuelve a los de muestra
    db.productos.forEach((p) => (p.is_published = false));
    pagina = await enLaPagina();
    ok(
      !pagina.includes("frutos rojos") && pagina.includes("Pronto vas a ver"),
      "con todo oculto, la página no muestra productos ni precios de muestra",
    );

    // 9. si la base no responde, sí se usa el respaldo
    const caida = await b.newContext({ ...disp });
    await caida.addInitScript(() =>
      sessionStorage.setItem("amoma-splash", "1"),
    );
    await caida.route("https://fake.supabase.co/**", (r) => r.abort());
    const pc = await caida.newPage();
    await pc.goto(PANEL + "/", { waitUntil: "networkidle" });
    await pc.waitForTimeout(400);
    ok(
      (await pc.locator("#tortas").innerText()).includes("frutos rojos"),
      "si la base no responde, la página muestra el respaldo (no queda vacía)",
    );
    await caida.close();

    ok(
      !errs.length,
      "sin errores de consola" + (errs.length ? ": " + errs[0] : ""),
    );
    await panel.context().close();
    await cliente.context().close();
  }
  await b.close();
  console.log(fallas ? `\n${fallas} FALLA(S)` : "\nTODO OK");
  process.exit(fallas ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
