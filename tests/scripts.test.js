// Las comprobaciones "desde afuera" (scripts/*.sh) contra servidores de
// mentira levantados acá: el caso bueno pasa y cada caso malo se detecta.
// Las cabeceras se leen del archivo real que se publica (public/_headers).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const correr = (archivo, args, env = {}) =>
  new Promise((listo) => {
    const p = spawn("bash", [archivo, ...args], {
      env: { ...process.env, ...env },
    });
    let salida = "";
    p.stdout.on("data", (d) => (salida += d));
    p.stderr.on("data", (d) => (salida += d));
    p.on("close", (codigo) => listo({ codigo, salida }));
  });

async function conServidor(atender, usar) {
  const s = createServer(atender);
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  try {
    return await usar(`http://127.0.0.1:${s.address().port}`);
  } finally {
    s.close();
  }
}

// ───────── sitio publicado ─────────
function cabecerasPublicadas() {
  const bloques = {};
  let actual = null;
  for (const l of readFileSync("public/_headers", "utf8").split("\n")) {
    if (!l.trim() || l.startsWith("#")) continue;
    if (!l.startsWith(" ")) bloques[(actual = l.trim())] = {};
    else {
      const i = l.indexOf(":");
      bloques[actual][l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
  }
  return bloques;
}
const sitio = (
  cambiar = (c) => c,
  portada = '<!doctype html><div id="root"></div>',
) => {
  const b = cabecerasPublicadas();
  return (req, res) => {
    const ruta = req.url.split("?")[0];
    const extra = ruta.startsWith("/admin") ? b["/admin"] : {};
    const cab = cambiar({ ...b["/*"], ...extra }, ruta);
    if (ruta === "/robots.txt")
      return res.writeHead(200, cab).end("User-agent: *\nDisallow: /admin\n");
    if (ruta === "/sitemap.xml")
      return res.writeHead(200, cab).end("<urlset></urlset>");
    res.writeHead(200, { "Content-Type": "text/html", ...cab }).end(portada);
  };
};

test("sitio: con las cabeceras de public/_headers pasa", async () => {
  await conServidor(sitio(), async (u) => {
    const r = await correr("scripts/comprobar-sitio.sh", [u, "--con-panel"]);
    assert.equal(r.codigo, 0, r.salida);
    assert.match(r.salida, /El panel no se ofrece a los buscadores/);
  });
});

for (const [nombre, cambiar, portada, espera] of [
  [
    "sin lista de orígenes permitidos",
    (c) => (delete c["Content-Security-Policy"], c),
    undefined,
    /Falta la lista de orígenes/,
  ],
  [
    "permite código incrustado",
    (c) => (
      (c["Content-Security-Policy"] = c["Content-Security-Policy"].replace(
        "script-src 'self'",
        "script-src 'self' 'unsafe-inline'",
      )),
      c
    ),
    undefined,
    /código incrustado/,
  ],
  [
    "sin conexión segura forzada",
    (c) => (delete c["Strict-Transport-Security"], c),
    undefined,
    /Strict-Transport-Security/,
  ],
  [
    "panel visible para buscadores",
    (c, ruta) => (ruta.startsWith("/admin") && delete c["X-Robots-Tag"], c),
    undefined,
    /noindex/,
  ],
  [
    "portada con marcadores",
    (c) => c,
    '<div id="root"></div><title>[TEXTO: título]</title>',
    /marcadores/,
  ],
])
  test(`sitio: ${nombre} → falla`, async () => {
    await conServidor(sitio(cambiar, portada), async (u) => {
      const r = await correr("scripts/comprobar-sitio.sh", [u, "--con-panel"]);
      assert.equal(r.codigo, 1, r.salida);
      assert.match(r.salida, espera);
    });
  });

test("sitio: una dirección sin https se rechaza; un sitio caído lo dice", async () => {
  const a = await correr("scripts/comprobar-sitio.sh", ["http://ejemplo.com"]);
  assert.equal(a.codigo, 1);
  const b = await correr("scripts/comprobar-sitio.sh", ["http://127.0.0.1:9"]);
  assert.equal(b.codigo, 1);
  assert.match(b.salida, /no responde/);
});

// ───────── base de datos ─────────
const PRIVADAS = ["inquiries", "admins", "audit_log"];
const base =
  ({
    registroAbierto = false,
    consultasLegibles = false,
    escribe = false,
  } = {}) =>
  (req, res) => {
    const ruta = req.url.split("?")[0];
    const json = (codigo, cuerpo) =>
      res
        .writeHead(codigo, { "Content-Type": "application/json" })
        .end(JSON.stringify(cuerpo));
    if (ruta === "/auth/v1/settings")
      return json(200, {
        disable_signup: !registroAbierto,
        mailer_autoconfirm: false,
        external: { anonymous_users: false },
      });
    if (ruta === "/auth/v1/signup")
      return registroAbierto
        ? json(200, { id: "x" })
        : json(422, { error_code: "signup_disabled" });
    if (ruta.startsWith("/storage/v1/object/list")) return json(200, []);
    if (ruta.startsWith("/storage/"))
      return json(403, {
        message: "new row violates row-level security policy",
      });
    const tabla = ruta.replace("/rest/v1/", "");
    if (req.method !== "GET")
      return escribe
        ? json(204, null)
        : json(401, { message: "permission denied" });
    if (PRIVADAS.includes(tabla))
      return consultasLegibles && tabla === "inquiries"
        ? json(200, [{ email: "a@b.c" }])
        : json(401, { message: "permission denied" });
    return json(200, []);
  };

test("base: cerrada pasa; registro abierto, tabla privada legible o escritura pública fallan", async () => {
  const clave = "sb_publishable_prueba";
  await conServidor(base(), async (u) => {
    const r = await correr("scripts/comprobar-base.sh", [u, clave]);
    assert.equal(r.codigo, 0, r.salida);
  });
  for (const [caso, espera] of [
    [{ registroAbierto: true }, /registro público está ABIERTO/],
    [{ consultasLegibles: true }, /No lee las consultas/],
    [{ escribe: true }, /No cambia precios/],
  ])
    await conServidor(base(caso), async (u) => {
      const r = await correr("scripts/comprobar-base.sh", [u, clave]);
      assert.equal(r.codigo, 1, r.salida);
      assert.match(r.salida, espera);
    });
});

test("base: si se le pasa una clave secreta, se niega a usarla", async () => {
  const r = await correr("scripts/comprobar-base.sh", [
    "http://127.0.0.1:9",
    "sb_" + "secret_" + "x",
  ]);
  assert.equal(r.codigo, 2);
  assert.match(r.salida, /SECRETA/);
});

// ───────── control de salud (lo que corre una vez por mes) ─────────
// npm y gh de mentira: así se prueba la regla del backup sin internet.
function herramientasFalsas({ backupHaceDias, auditOk = true }) {
  const dir = mkdtempSync(join(tmpdir(), "falsas-"));
  const fecha = new Date(Date.now() - backupHaceDias * 86400000).toISOString();
  writeFileSync(join(dir, "gh"), `#!/bin/sh\necho "${fecha}"\n`, {
    mode: 0o755,
  });
  writeFileSync(join(dir, "npm"), `#!/bin/sh\nexit ${auditOk ? 0 : 1}\n`, {
    mode: 0o755,
  });
  return dir;
}
const salud = (u, b, extra) =>
  correr("scripts/control-de-salud.sh", [], {
    SITIO_URL: u,
    SUPABASE_URL: b,
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_prueba",
    BACKUPS_ENABLED: "true",
    GITHUB_REPOSITORY: "San-F/amoma-react",
    ...extra,
  });

test("control de salud: todo bien pasa; backup viejo, backup apagado, paquetes o falla simulada avisan", async () => {
  await conServidor(sitio(), (u) =>
    conServidor(base(), async (b) => {
      const PATH = (o) => `${herramientasFalsas(o)}:${process.env.PATH}`;
      const bien = await salud(u, b, { PATH: PATH({ backupHaceDias: 3 }) });
      assert.equal(bien.codigo, 0, bien.salida);
      assert.match(bien.salida, /Último backup: hace 3 día/);
      for (const [extra, espera] of [
        [{ PATH: PATH({ backupHaceDias: 15 }) }, /tiene 15 días/],
        [
          { PATH: PATH({ backupHaceDias: 3 }), BACKUPS_ENABLED: "" },
          /backup automático está apagado/,
        ],
        [
          { PATH: PATH({ backupHaceDias: 3, auditOk: false }) },
          /vulnerabilidades altas o críticas/,
        ],
        [
          { PATH: PATH({ backupHaceDias: 3 }), FORZAR_FALLA: "true" },
          /Falla simulada/,
        ],
        [
          { PATH: PATH({ backupHaceDias: 3 }), SITIO_URL: "" },
          /Falta la variable SITIO_URL/,
        ],
      ]) {
        const r = await salud(u, b, extra);
        assert.equal(r.codigo, 1, r.salida);
        assert.match(r.salida, espera);
      }
    }),
  );
});
