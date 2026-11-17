// Sella las migraciones: guarda la huella de cada una en
// supabase/migraciones-selladas.json. Desde ahí, tests/blindaje.test.js falla
// si alguien edita o borra una migración sellada (las ya aplicadas en una base
// real no se tocan: se escribe una nueva).
// Solo AGREGA las nuevas; nunca vuelve a sellar una que cambió.
// Uso: npm run base:sellar   (después de agregar una migración, con sus pruebas en verde)
import { createHash } from "node:crypto";
import fs from "node:fs";

const archivo = "supabase/migraciones-selladas.json";
const sello = fs.existsSync(archivo)
  ? JSON.parse(fs.readFileSync(archivo, "utf8"))
  : { migraciones: {} };
let nuevas = 0;
for (const f of fs
  .readdirSync("supabase/migrations")
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  const huella = createHash("sha256")
    .update(fs.readFileSync(`supabase/migrations/${f}`))
    .digest("hex");
  if (!(f in sello.migraciones)) {
    sello.migraciones[f] = huella;
    nuevas++;
    console.log("✓ sellada", f);
  } else if (sello.migraciones[f] !== huella) {
    console.error(
      `✗ ${f} cambió después de sellarse. No se vuelve a sellar: deshacer el cambio y escribir una migración nueva.`,
    );
    process.exit(1);
  }
}
sello._ =
  "Huellas de las migraciones. Lo escribe scripts/sellar-migraciones.mjs (npm run base:sellar). No se edita a mano.";
fs.writeFileSync(archivo, JSON.stringify(sello, null, 2) + "\n");
console.log(
  nuevas
    ? `${nuevas} migración(es) nueva(s) sellada(s).`
    : "Sin migraciones nuevas.",
);
