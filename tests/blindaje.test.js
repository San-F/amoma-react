// Blindajes: reglas del proyecto que tienen que seguir valiendo aunque nadie
// relea CLAUDE.md. Cada una frena un atajo que ya se tomó alguna vez.
// Si una falla, NO se toca la prueba ni los números de tests/minimos.json: se
// arregla lo que la rompió. Sacar una regla o bajar un mínimo necesita el OK de
// Francisco. (Traído de San-F/web-plantilla.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITIO_URL } from "../src/data/direccion.js";

const leer = (p) => readFileSync(p, "utf8");
const archivos = (dir, filtro = () => true) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory()
      ? archivos(p, filtro)
      : filtro(p)
        ? [p]
        : [];
  });
const esCodigo = (p) => /\.(jsx?|cjs|mjs)$/.test(p);
const FUENTES = archivos("src", esCodigo);
const PRUEBAS = archivos("tests", esCodigo).filter(
  (p) => !p.endsWith("blindaje.test.js"),
);
const FLUJOS = archivos(".github/workflows", (p) => p.endsWith(".yml"));
const cuenta = (texto, expresion) => (texto.match(expresion) ?? []).length;
const hallar = (lista, expresion) =>
  lista.flatMap((p) =>
    leer(p)
      .split("\n")
      .map((l, i) =>
        expresion.test(l) ? `${p}:${i + 1}: ${l.trim().slice(0, 90)}` : null,
      )
      .filter(Boolean),
  );

// ───────── las pruebas no se saltean ni se debilitan ─────────
test("ninguna prueba está salteada, aislada o pendiente", () => {
  assert.deepEqual(
    hallar(
      PRUEBAS,
      /\b(test|it|describe)\.(skip|only|todo)\b|\bx(it|test|describe)\(|\{\s*skip:\s*true|\{\s*todo:\s*true/,
    ),
    [],
  );
});

test("la verificación automática no tapa fallas", () => {
  assert.deepEqual(
    hallar(
      FLUJOS,
      /continue-on-error:\s*true|\|\|\s*true\s*$|\|\|\s*:\s*$|if:\s*false/,
    ),
    [],
  );
  const v = leer(".github/workflows/ci.yml");
  for (const paso of [
    "npm run lint",
    "npm run format:check",
    "npm run test:unit",
    "npm run build",
    "npm run test:e2e",
    "supabase/tests/run-local.sh",
    "backup-ida-y-vuelta.sh",
    "comprobar-armado.sh",
    "npm audit",
    "gitleaks",
    "npm run casos-malos",
  ])
    assert.ok(v.includes(paso), `verificar.yml ya no corre: ${paso}`);
});

test("la cantidad de comprobaciones no baja (tests/minimos.json)", () => {
  const minimos = JSON.parse(leer("tests/minimos.json")).minimos;
  const hoy = {
    "permisos de la base (supabase/tests/rls.test.sql)": cuenta(
      leer("supabase/tests/rls.test.sql"),
      /tests\.expect_\w+\(/g,
    ),
    "pruebas unitarias (tests/*.test.js)": readdirSync("tests")
      .filter((f) => f.endsWith(".test.js"))
      .reduce((n, f) => n + cuenta(leer(join("tests", f)), /^\s*test\(/gm), 0),
    "comprobaciones de navegador (tests/e2e)": readdirSync("tests/e2e")
      .filter((f) => f.endsWith(".e2e.cjs"))
      .reduce((n, f) => n + cuenta(leer(join("tests/e2e", f)), /\bok\(/g), 0),
    "casos malos (tests/casos-malos.json)": JSON.parse(
      leer("tests/casos-malos.json"),
    ).casos.length,
  };
  for (const [que, minimo] of Object.entries(minimos))
    assert.ok(
      hoy[que] >= minimo,
      `${que}: hay ${hoy[que]}, el mínimo es ${minimo}. Se sacaron pruebas.`,
    );
  assert.deepEqual(Object.keys(minimos).sort(), Object.keys(hoy).sort());
});

// ───────── la base: lo ya aplicado no se edita ─────────
test("las migraciones selladas no cambiaron, y las nuevas van después", () => {
  const sello = JSON.parse(
    leer("supabase/migraciones-selladas.json"),
  ).migraciones;
  const enDisco = readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const [nombre, huella] of Object.entries(sello)) {
    assert.ok(enDisco.includes(nombre), `se borró la migración ${nombre}`);
    const actual = createHash("sha256")
      .update(readFileSync(join("supabase/migrations", nombre)))
      .digest("hex");
    assert.equal(
      actual,
      huella,
      `${nombre} fue editada. Una migración ya usada no se toca: se escribe una nueva.`,
    );
  }
  const ultima = Object.keys(sello).sort().at(-1);
  for (const nueva of enDisco.filter((f) => !(f in sello)))
    assert.ok(
      nueva > ultima,
      `${nueva} tiene que ordenarse después de ${ultima} (fecha y hora en el nombre)`,
    );
});

// ───────── el código que recibe el navegador ─────────
test("no se inserta HTML sin limpiar ni se ejecuta texto como código", () => {
  assert.deepEqual(
    hallar(
      FUENTES,
      /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(|new Function\(/,
    ),
    [],
  );
});

test("ninguna clave secreta ni nombre de clave secreta en el código del sitio", () => {
  assert.deepEqual(
    hallar(
      [...FUENTES, "index.html", ".env.example"],
      /service_role|sb_secret_|SECRET_KEY|DB_URL|PASSPHRASE|APP_USR-|ACCESS_TOKEN/,
    ),
    [],
  );
});

test("solo se usan las variables públicas conocidas", () => {
  const permitidas = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_TURNSTILE_SITE_KEY",
  ];
  const usadas = new Set(
    [...FUENTES, ".env.example"].flatMap(
      (p) => leer(p).match(/VITE_[A-Z0-9_]+/g) ?? [],
    ),
  );
  assert.deepEqual(
    [...usadas].filter((v) => !permitidas.includes(v)),
    [],
    "todo VITE_* termina en el navegador: una variable nueva se agrega acá a propósito",
  );
});

test("'Salir' y los links a otros sitios, como corresponde", () => {
  // signOut() sin alcance cierra la sesión en todos los dispositivos
  assert.deepEqual(
    hallar(FUENTES, /signOut\((?!\{\s*scope:\s*"local"\s*\}\))/),
    [],
  );
  // una pestaña nueva no puede manejar la página que la abrió
  for (const p of FUENTES) {
    const t = leer(p);
    assert.ok(
      cuenta(t, /target="_blank"/g) <= cuenta(t, /rel="noopener noreferrer"/g),
      `${p}: hay un target="_blank" sin rel="noopener noreferrer"`,
    );
  }
});

test("el sitio no carga nada de terceros fuera de lo permitido", () => {
  const permitidos = [
    "wa.me",
    "www.instagram.com",
    "challenges.cloudflare.com",
    "schema.org",
    "www.w3.org",
    "fake.supabase.co",
    new URL(SITIO_URL).host, // la propia dirección del sitio
  ];
  const hosts = new Set(
    [...FUENTES, "index.html", "public/splash.js"].flatMap((p) =>
      (leer(p).match(/https?:\/\/[a-zA-Z0-9.-]+/g) ?? []).map((u) =>
        u.replace(/^https?:\/\//, ""),
      ),
    ),
  );
  assert.deepEqual(
    [...hosts].filter((h) => !permitidos.includes(h)),
    [],
    "un servicio externo nuevo se agrega acá Y a la lista de orígenes de public/_headers, en el mismo cambio",
  );
  assert.deepEqual(
    hallar(["index.html"], /<script[^>]+src="https?:|<link[^>]+href="https?:/),
    [],
  );
});

test("sin registros con datos en la consola", () => {
  assert.deepEqual(hallar(FUENTES, /console\.(log|debug|info|table)\(/), []);
});

// ───────── paquetes y automatizaciones ─────────
test("las piezas de GitHub están fijadas por identificador y con permisos mínimos", () => {
  assert.ok(FLUJOS.length >= 4, "no se encontraron las automatizaciones");
  for (const f of FLUJOS) {
    const t = leer(f);
    for (const uso of t.match(/uses:\s*\S+/g) ?? [])
      assert.match(
        uso,
        /@[0-9a-f]{40}$/,
        `${f}: ${uso} tiene que ir fijado por identificador completo`,
      );
    assert.match(
      t,
      /^permissions:\n {2}(contents|issues): (read|write)/m,
      `${f}: falta declarar los permisos`,
    );
    assert.doesNotMatch(
      t,
      /pull_request_target|permissions:\s*write-all/,
      `${f}: patrón peligroso`,
    );
  }
});

// El sitio se publica solo en Cloudflare Pages (Vercel se dio de baja el 17/11/2026).
// Un archivo de configuración de otro hosting volvería a abrir una segunda copia
// con otras cabeceras de seguridad.
test("el sitio se publica solo en Cloudflare (sin configuración de otro hosting)", () => {
  const otros = readdirSync(".").filter((f) =>
    /^(vercel\.json|netlify\.toml|\.vercel|firebase\.json)$/.test(f),
  );
  assert.deepEqual(
    otros,
    [],
    "hosting único: Cloudflare Pages (public/_headers)",
  );
  assert.match(leer("public/_headers"), /Content-Security-Policy:/);
});

test("los paquetes están fijados a una versión exacta", () => {
  const p = JSON.parse(leer("package.json"));
  const flojos = Object.entries({
    ...p.dependencies,
    ...p.devDependencies,
  }).filter(([, v]) => !/^\d+\.\d+\.\d+$/.test(v));
  assert.deepEqual(flojos, [], "sin ^ ni ~: se instala con npm i -E");
});
