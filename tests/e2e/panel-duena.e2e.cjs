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
        code: 1,
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
        code: 2,
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
    galeria: [
      {
        id: "g1",
        storage_path: "galeria/g1.webp",
        alt_text: "Torta arcoíris",
        width: 800,
        height: 800,
        sort_order: 0,
        is_published: true,
      },
      {
        id: "g2",
        storage_path: "galeria/g2.webp",
        alt_text: "Torta de surf",
        width: 800,
        height: 800,
        sort_order: 1,
        is_published: true,
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
    if (u.pathname === "/rest/v1/categories") {
      if (m === "PATCH") {
        const c = db.categorias.find((x) => x.id === id);
        Object.assign(c, cuerpo());
        db.llamadas.push(["categoria", id, cuerpo()]);
        return L.json(r, [{ id }]);
      }
      return L.json(r, db.categorias);
    }
    if (u.pathname === "/rest/v1/site_settings")
      return L.json(r, { id: 1, whatsapp: "5491136362466" });
    // conteos (HEAD … count=exact): ¿cuántas filas usan este archivo?
    const filtroRuta = (q.get("storage_path") || "").replace("eq.", "");
    if (m === "HEAD") {
      const n =
        u.pathname === "/rest/v1/gallery_items"
          ? db.galeria.filter(
              (g) => !filtroRuta || g.storage_path === filtroRuta,
            ).length
          : db.productos
              .flatMap((p) => p.images)
              .filter((i) => !filtroRuta || i.storage_path === filtroRuta)
              .length;
      return r.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-expose-headers": "content-range",
          "content-range": `*/${n}`,
        },
      });
    }
    if (u.pathname === "/rest/v1/gallery_items") {
      if (m === "PATCH") {
        db.llamadas.push(["galeria", id, cuerpo()]);
        if (db.rechazarCambios) return L.json(r, []);
        Object.assign(
          db.galeria.find((g) => g.id === id),
          cuerpo(),
        );
        return L.json(r, [{ id }]);
      }
      if (m === "POST") {
        const b = cuerpo();
        db.llamadas.push(["galeria-nueva", b]);
        db.galeria.push({ id: "g" + Date.now(), ...b });
        return L.json(r, {});
      }
      let lista = [...db.galeria].sort((a, b) => a.sort_order - b.sort_order);
      if (q.get("is_published") === "eq.true")
        lista = lista.filter((g) => g.is_published);
      if (q.get("order")?.startsWith("sort_order.desc")) lista.reverse();
      return L.json(r, lista);
    }
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
      const items = [...payload.products].sort(
        (a, b) => (a.code ? 0 : 1) - (b.code ? 0 : 1),
      );
      for (const it of items) {
        let p = it.code
          ? db.productos.find((x) => String(x.code) === String(it.code))
          : db.productos.find(
              (x) => x.name.toLowerCase() === it.name.toLowerCase(),
            );
        if (it.code && !p)
          return L.json(
            r,
            {
              code: "22023",
              message: `Fila de "${it.name}": no hay ningún producto con el código ${it.code}`,
            },
            400,
          );
        const cat = db.categorias.find((c) => c.slug === it.category_slug);
        if (!p) {
          p = {
            id: "n" + db.productos.length,
            code: Math.max(...db.productos.map((x) => x.code)) + 1,
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
      if (m === "DELETE") {
        const ids = (q.get("id") || "").replace(/^in\.\(|\)$/g, "").split(",");
        for (const p of db.productos)
          p.images = p.images.filter((i) => !ids.includes(i.id));
        return L.json(
          r,
          ids.map((x) => ({ id: x })),
        );
      }
      // fotos de productos (para elegir una ya cargada / ver la portada)
      const pid = (q.get("product_id") || "").replace("eq.", "");
      let imgs = db.productos.flatMap((p) =>
        p.images.map((i) => ({
          ...i,
          product_id: p.id,
          product: { name: p.name },
        })),
      );
      if (pid) imgs = imgs.filter((i) => i.product_id === pid);
      if (q.get("is_cover") === "eq.true")
        imgs = imgs.filter((i) => i.is_cover);
      return L.json(r, imgs);
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

    ok(
      await panel.getByRole("link", { name: "Excel" }).isVisible(),
      "el botón Excel está a la vista arriba en Productos",
    );

    // 1b. cambiar el nombre de una categoría (no se pueden agregar)
    ok(
      !(await panel.getByText(/Nueva categoría|Agregar categoría/).count()),
      "categorías: no hay forma de agregar una nueva",
    );
    await panel.getByRole("button", { name: "Cambiar nombre" }).first().click();
    await panel
      .getByLabel("Nombre de la categoría Tortas")
      .fill("Tortas de la casa");
    await panel.getByRole("button", { name: "Guardar", exact: true }).click();
    await panel.getByRole("heading", { name: "Tortas de la casa" }).waitFor();
    const renombre = db.llamadas.find((l) => l[0] === "categoria");
    ok(
      renombre && Object.keys(renombre[2]).join() === "name",
      "categorías: se guarda solo el nombre",
    );
    pagina = await enLaPagina();
    ok(
      pagina.includes("Tortas de la casa"),
      "el nombre nuevo aparece en el filtro del catálogo",
    );
    await cliente.goto(PANEL + "/", { waitUntil: "networkidle" });
    ok(
      (await cliente.locator("#categorias").innerText()).includes(
        "Tortas de la casa",
      ),
      "el nombre nuevo aparece en la tarjeta de la portada",
    );
    await panel.goto(PANEL + "/admin/productos", { waitUntil: "networkidle" });

    // 2. cambiar un precio
    await panel.getByRole("link", { name: /Lemon pie/ }).click();
    await panel.getByRole("textbox", { name: "Precio 1" }).fill("21.000");
    await panel.getByRole("button", { name: "Guardar cambios" }).click();
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

    // 4. ocultar desde la ficha ("Mostrar en la página")
    await captura(panel, "lista");
    await panel.getByRole("link", { name: /Lemon pie/ }).click();
    await panel.getByRole("switch", { name: /Mostrar en la página/ }).uncheck();
    await panel.getByRole("button", { name: "Guardar cambios" }).click();
    await panel.getByText("Guardado ✓").waitFor();
    await panel.goto(PANEL + "/admin/productos", { waitUntil: "networkidle" });
    ok(
      await panel
        .locator(".adm-prod", { hasText: "Lemon pie" })
        .getByText("Oculto")
        .isVisible(),
      "la lista marca el producto como Oculto",
    );
    pagina = await enLaPagina();
    ok(!pagina.includes("Lemon pie"), "ocultar: el cliente deja de verlo");
    ok(
      !(await enLaPagina(panel)).includes("Lemon pie"),
      "ocultar: la dueña, con su sesión abierta, tampoco lo ve en la página",
    );

    // 5. Excel de punta a punta: bajar, editar en "Excel", guardar como .xlsx,
    //    subir, revisar la vista previa, importar y volver a bajar.
    const { readSheet } = await import("read-excel-file/universal");
    const { default: escribirXlsx } =
      await import("write-excel-file/universal");
    const bajarExcel = async (boton) => {
      const [d] = await Promise.all([
        panel.waitForEvent("download"),
        panel.getByRole("button", { name: boton }).click(),
      ]);
      const bytes = fs.readFileSync(await d.path());
      return {
        nombre: d.suggestedFilename(),
        bytes,
        hoja: await readSheet(new Blob([bytes])),
      };
    };
    // "guardar en Excel": vuelve a ser un .xlsx (como lo dejaría la dueña)
    const guardarComoXlsx = async (hoja) =>
      Buffer.from(
        await (
          await escribirXlsx(
            hoja.map((f) => f.map((v) => ({ value: v ?? null }))),
          )
        )
          .toBlob()
          .then((b) => b.arrayBuffer()),
      );
    const subirExcel = (bytes, nombre = "amoma-catalogo.xlsx") =>
      panel.locator('input[type=file][accept=".xlsx,.csv"]').setInputFiles({
        name: nombre,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: bytes,
      });

    await panel.goto(PANEL + "/admin/importar", { waitUntil: "networkidle" });
    const cat1 = await bajarExcel("Descargar mi catálogo");
    ok(
      cat1.bytes[0] === 0x50 &&
        cat1.bytes[1] === 0x4b &&
        cat1.nombre === "amoma-catalogo.xlsx",
      "Excel: 'Descargar mi catálogo' baja un .xlsx",
    );
    const fila = (hoja, codigo, tam) =>
      hoja.find((f) => f[7] === codigo && f[3] === tam);
    ok(
      cat1.hoja[0][7] === "Código (no tocar)" &&
        fila(cat1.hoja, 1, "Chica")?.[0] === "Lemon pie" &&
        fila(cat1.hoja, 1, "Chica")?.[5] === 21000 &&
        fila(cat1.hoja, 1, "Chica")?.[6] === "no" &&
        fila(cat1.hoja, 2, "Chica")?.[1] === "Tortas de la casa",
      "la planilla trae lo cargado: código de número, precio nuevo, oculto = no",
    );

    // la dueña: renombra el Lemon pie (código 1), le cambia un precio, borra
    // el tamaño Grande y suma una torta nueva sin código
    const hoja = cat1.hoja.filter((f) => !(f[7] === 1 && f[3] === "Grande"));
    for (const f of hoja) if (f[7] === 1) f[0] = "Lemon pie clásico";
    fila(hoja, 1, "Chica")[5] = 23500;
    fila(hoja, 1, "Chica")[6] = null;
    hoja.push([
      "Torta nueva",
      "Tortas de la casa",
      "Recién salida",
      "Única",
      null,
      40000,
      null,
      null,
    ]);
    await subirExcel(await guardarComoXlsx(hoja));
    await panel.getByText("Vista previa").waitFor();
    await captura(panel, "excel");
    ok(
      !(await panel.locator(".adm-bloque .adm-error").count()),
      "la planilla editada (.xlsx) se lee sin errores",
    );
    ok(
      (
        await panel
          .locator(".adm-tabla tbody tr", { hasText: "Torta nueva" })
          .innerText()
      )
        .toLowerCase()
        .includes("nuevo"),
      "la vista previa marca qué productos son nuevos",
    );
    await panel.getByRole("button", { name: /Importar 3 producto/ }).click();
    await panel.getByText(/1 nuevo\(s\), 2\s+actualizado\(s\)/).waitFor();
    const lemon = db.productos.find((p) => p.code === 1);
    ok(
      lemon.name === "Lemon pie clásico" &&
        lemon.variants.length === 1 &&
        lemon.variants[0].price_cents === 2350000 &&
        db.productos.length === 3,
      "Excel: cambia nombre y precio del mismo producto (por código), saca el tamaño borrado y agrega el nuevo",
    );
    ok(
      lemon.is_published === false,
      "Excel: lo que estaba oculto sigue oculto",
    );
    ok(
      await panel.getByRole("link", { name: "Ponerles foto →" }).isVisible(),
      "después de importar, lleva a ponerle foto a los nuevos",
    );

    // volver a bajar: los códigos no cambiaron y el nuevo ya tiene el suyo
    await panel.goto(PANEL + "/admin/importar", { waitUntil: "networkidle" });
    const cat2 = await bajarExcel("Descargar mi catálogo");
    ok(
      fila(cat2.hoja, 1, "Chica")?.[0] === "Lemon pie clásico" &&
        cat2.hoja.some((f) => f[0] === "Torta nueva" && f[7] === 3),
      "al volver a bajar: mismo código para el renombrado y número nuevo para la torta nueva",
    );

    // un código tocado a mano: avisa y no deja importar
    const tocada = cat2.hoja.map((f) => [...f]);
    tocada[1][7] = 99;
    await subirExcel(await guardarComoXlsx(tocada));
    await panel.getByText("Vista previa").waitFor();
    await panel.getByRole("button", { name: /Importar/ }).click();
    await panel.getByText(/no hay ningún producto con el código 99/).waitFor();
    ok(true, "un código inexistente se avisa y no se guarda nada");

    // planilla vacía con ejemplos: se completa y se sube
    const vacia = await bajarExcel("Planilla vacía con ejemplos");
    ok(
      vacia.nombre === "amoma-planilla-vacia.xlsx" && vacia.hoja.length === 4,
      "Excel: la planilla vacía trae 3 filas de ejemplo",
    );
    const completada = [
      ...vacia.hoja,
      [
        "Budín de limón",
        "Tartas y postres",
        "Húmedo",
        "Único",
        null,
        12000,
        "sí",
        null,
      ],
    ];
    await subirExcel(
      await guardarComoXlsx(completada),
      "amoma-planilla-vacia.xlsx",
    );
    await panel.getByText("Vista previa").waitFor();
    ok(
      await panel
        .getByRole("button", { name: /Importar 1 producto/ })
        .isVisible(),
      "la planilla vacía completada: los ejemplos se ignoran, entra solo lo nuevo",
    );

    // 6. mostrar algo sin precio: no deja y explica por qué
    db.productos.find((p) => p.slug === "torta-nueva").variants = [];
    db.productos.find((p) => p.slug === "torta-nueva").is_published = false;
    await panel.goto(
      PANEL +
        "/admin/productos/" +
        db.productos.find((p) => p.slug === "torta-nueva").id,
      { waitUntil: "networkidle" },
    );
    await panel.getByRole("switch", { name: /Mostrar en la página/ }).check();
    await panel.getByRole("button", { name: "Guardar cambios" }).click();
    ok(
      await panel
        .getByText("Para mostrarlo en la página, cargá al menos un precio.")
        .isVisible(),
      "no deja mostrar un producto sin precio y explica por qué",
    );

    // 7. Fotos (feed): ocultar; y si la base no cambió nada, el panel avisa
    await panel.goto(PANEL + "/admin/galeria", { waitUntil: "networkidle" });
    await captura(panel, "fotos");
    db.rechazarCambios = true;
    await panel.getByRole("button", { name: "Ocultar foto 1" }).click();
    await panel.getByText(/No se pudo actualizar la foto/).waitFor();
    ok(true, "si la base rechaza el cambio en silencio, el panel avisa");
    db.rechazarCambios = false;
    await panel.getByRole("button", { name: "Ocultar foto 1" }).click();
    await panel.getByText("Oculta ✓ (sigue guardada acá)").waitFor();
    pagina = await (async () => {
      await cliente.goto(PANEL + "/galeria", { waitUntil: "networkidle" });
      return cliente.locator(".galeria__grid img").count();
    })();
    ok(
      pagina === 1,
      "Fotos: la oculta deja de verse en la galería de la página",
    );

    // 7a. ordenar: se arrastra y recién "Guardar orden" guarda
    const ordenAntes = db.galeria.map((g) => g.id).join();
    await panel.getByRole("button", { name: "Ordenar" }).click();
    const manija = panel.getByRole("button", { name: "Arrastrar foto 2" });
    const destino = panel.locator(".adm-feed li").first();
    const a = await manija.boundingBox();
    const d0 = await destino.boundingBox();
    await panel.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await panel.mouse.down();
    await panel.mouse.move(d0.x + d0.width / 2, d0.y + d0.height / 2, {
      steps: 8,
    });
    await panel.mouse.up();
    ok(
      db.galeria.map((g) => g.id).join() === ordenAntes &&
        (
          await panel.locator(".adm-feed li img").first().getAttribute("src")
        ).includes("g2"),
      "Ordenar: arrastrar cambia el orden en pantalla sin guardar todavía",
    );
    await captura(panel, "fotos-ordenar");
    await panel.getByRole("button", { name: "Guardar orden" }).click();
    await panel.getByText("Orden guardado ✓").waitFor();
    ok(
      db.galeria.find((g) => g.id === "g2").sort_order === 0 &&
        db.galeria.find((g) => g.id === "g1").sort_order === 1,
      "Ordenar: 'Guardar orden' guarda el orden nuevo",
    );

    // 7b. foto de un producto: elegir una ya cargada (sin subir de nuevo)
    await panel.goto(PANEL + "/admin/productos/p2", {
      waitUntil: "networkidle",
    });
    await panel.getByRole("button", { name: "Cambiar foto" }).click();
    await panel
      .getByRole("button", { name: "Usar la foto de Galería" })
      .first()
      .click();
    await panel.getByText("Foto guardada ✓").waitFor();
    ok(
      db.productos
        .find((p) => p.id === "p2")
        .images.some(
          (i) =>
            i.storage_path ===
              db.galeria.find((g) => g.sort_order === 0).storage_path &&
            i.is_cover,
        ),
      "elegir una foto ya cargada la usa como portada (mismo archivo)",
    );
    // la ventana de acomodar se abre sola: es opcional
    await panel.getByRole("button", { name: "Cancelar" }).click();
    ok(
      await panel.getByText("✓ En la galería").isVisible(),
      "si la foto ya está en la galería, lo dice (no la duplica)",
    );

    // 7c. Publicar: arma la imagen y la descarga
    await panel.goto(PANEL + "/admin/publicar", { waitUntil: "networkidle" });
    await panel.waitForFunction(() => {
      const c = document.querySelector(".adm-pub__lienzo canvas");
      return (
        c && c.width === 1080 && !document.querySelector(".adm-pub__cargando")
      );
    });
    await captura(panel, "publicar");
    const [img] = await Promise.all([
      panel.waitForEvent("download"),
      panel.getByRole("button", { name: /Descargar imagen/ }).click(),
    ]);
    const bytes = fs.readFileSync(await img.path());
    ok(
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.length > 20000,
      `Publicar: descarga una imagen JPG (${Math.round(bytes.length / 1024)} KB)`,
    );
    await panel.getByRole("button", { name: "Portada" }).click();
    await panel.getByRole("button", { name: "Historia" }).click();
    await panel.getByRole("button", { name: "Chocolate" }).click();
    const dim = await panel.evaluate(() => {
      const c = document.querySelector(".adm-pub__lienzo canvas");
      return `${c.width}x${c.height}`;
    });
    ok(dim === "1080x1920", "Publicar: la historia sale en 1080×1920");
    await captura(panel, "publicar-historia");
    await panel.getByRole("button", { name: "Póster" }).click();
    await panel.getByRole("button", { name: "Crema" }).click();
    const lienzo = panel.locator(".adm-pub__lienzo canvas");
    const antesMover = await lienzo.evaluate((c) => c.toDataURL().length);
    await panel.getByRole("button", { name: /Mover y agrandar/ }).click();
    await panel.getByRole("slider", { name: /Acercar/ }).fill("1.8");
    const caja = await lienzo.boundingBox();
    await panel.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 3);
    await panel.mouse.down();
    await panel.mouse.move(
      caja.x + caja.width / 2 + 60,
      caja.y + caja.height / 3 + 40,
      { steps: 6 },
    );
    await panel.mouse.up();
    ok(
      (await lienzo.evaluate((c) => c.toDataURL().length)) !== antesMover,
      "Publicar: la foto se puede agrandar y mover sobre la vista previa",
    );
    await captura(panel, "publicar-poster");
    const sinEtiqueta = await lienzo.evaluate((c) => c.toDataURL().length);
    await panel.selectOption("#pub-etiqueta", "nuevo");
    ok(
      (await lienzo.evaluate((c) => c.toDataURL().length)) !== sinEtiqueta,
      "Publicar: se puede sumar la etiqueta (Nuevo) a la imagen",
    );
    await panel.selectOption("#pub-etiqueta", "");
    await panel.getByRole("button", { name: "Listo" }).click();
    await panel.getByRole("button", { name: "Vitrina" }).click();
    await panel.getByRole("button", { name: /Mover y agrandar/ }).click();
    ok(
      await panel
        .getByRole("slider", { name: "Tamaño del círculo" })
        .isVisible(),
      "Publicar: en Vitrina se puede cambiar el tamaño del círculo",
    );
    await panel.getByRole("button", { name: "Listo" }).click();

    // el logo se dibuja redondo y sin deformar (mismo ancho y alto)
    ok(
      await panel.evaluate(() => {
        const c = document.querySelector(".adm-pub__lienzo canvas");
        const d = c.getContext("2d").getImageData(540, 150, 1, 1).data;
        return d[3] === 255;
      }),
      "Publicar: el logo está en su lugar",
    );

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
