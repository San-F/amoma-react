// Pruebas de navegador ("tocar mucho"): arma la página, la levanta en esta
// máquina y corre cada prueba en celular y compu. Uso: npm run test:e2e
//  - sitio público: como lo ve un cliente (sin base, con el catálogo fijo)
//  - panel: contra un Supabase SIMULADO (prueba la pantalla; los permisos
//    reales se prueban en supabase/tests con npm run test:db)
const { spawn, spawnSync } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const raiz = path.join(__dirname, "../..");
const tmp = path.join(raiz, ".e2e");
const SITIO = { puerto: 4173, dir: path.join(tmp, "sitio"), env: {} };
const PANEL = {
  puerto: 4175,
  dir: path.join(tmp, "panel"),
  env: {
    VITE_SUPABASE_URL: "https://fake.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  },
};
const vite = path.join(raiz, "node_modules/.bin/vite");

function armar({ dir, env }) {
  // sin variables de Supabase heredadas: cada armado usa solo las suyas
  const limpio = { ...process.env };
  delete limpio.VITE_SUPABASE_URL;
  delete limpio.VITE_SUPABASE_PUBLISHABLE_KEY;
  const r = spawnSync(vite, ["build", "--outDir", dir, "--logLevel", "error"], {
    cwd: raiz,
    env: { ...limpio, ...env },
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error("No se pudo armar la página");
}

function servir({ dir, puerto }) {
  return spawn(
    vite,
    ["preview", "--outDir", dir, "--port", String(puerto), "--strictPort"],
    { cwd: raiz, stdio: "ignore" },
  );
}

function esperar(puerto, intentos = 60) {
  return new Promise((ok, mal) => {
    const probar = (n) =>
      http
        .get(`http://localhost:${puerto}/`, (r) => {
          r.resume();
          ok();
        })
        .on("error", () =>
          n
            ? setTimeout(() => probar(n - 1), 250)
            : mal(new Error(`El puerto ${puerto} no respondió`)),
        );
    probar(intentos);
  });
}

(async () => {
  fs.mkdirSync(tmp, { recursive: true });
  armar(SITIO);
  armar(PANEL);
  const servidores = [servir(SITIO), servir(PANEL)];
  let fallaron = 0;
  try {
    await Promise.all([esperar(SITIO.puerto), esperar(PANEL.puerto)]);
    const pruebas = fs
      .readdirSync(__dirname)
      .filter((f) => f.endsWith(".e2e.cjs"))
      .sort();
    for (const f of pruebas) {
      console.log(`\n──────── ${f} ────────`);
      const r = spawnSync(process.execPath, [path.join(__dirname, f)], {
        cwd: raiz,
        stdio: "inherit",
        env: {
          ...process.env,
          E2E_SITIO: `http://localhost:${SITIO.puerto}`,
          E2E_PANEL: `http://localhost:${PANEL.puerto}`,
          E2E_CAPTURAS: path.join(tmp, "capturas"),
        },
      });
      if (r.status !== 0) {
        fallaron++;
        console.log(`✗ ${f} FALLÓ`);
      }
    }
  } finally {
    servidores.forEach((s) => s.kill());
  }
  console.log(
    fallaron
      ? `\n${fallaron} prueba(s) de navegador fallaron`
      : "\nTodas las pruebas de navegador pasaron",
  );
  process.exit(fallaron ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
