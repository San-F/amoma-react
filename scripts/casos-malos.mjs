// CASOS MALOS AUTOMÁTICOS. Una prueba en verde no dice si sirve: puede no estar
// mirando nada. Este programa lo comprueba: aplica, de a una, cada rotura de
// tests/casos-malos.json (un cambio chico que rompe una regla), corre la
// prueba que debería detectarla y exige que FALLE. Después restaura el archivo.
//
//   ✓ detectada   → la prueba sirve
//   ✗ SOBREVIVE   → se rompió una regla y ninguna prueba se quejó: hay un agujero
//   ✗ NO APLICA   → el texto a romper ya no está en el archivo (el código cambió
//                   y hay que actualizar la rotura, no borrarla)
//
// Uso:  npm run casos-malos                (rápidas + base; necesita Postgres local)
//       npm run casos-malos -- --lentas    (suma las de navegador: varios minutos)
//       npm run casos-malos -- --solo id   (una sola)
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const solo = args.includes("--solo") ? args[args.indexOf("--solo") + 1] : null;
const lentas = args.includes("--lentas");
const lista = JSON.parse(
  fs.readFileSync("tests/casos-malos.json", "utf8"),
).casos;

const ids = lista.map((c) => c.id);
if (new Set(ids).size !== ids.length) {
  console.error("✗ tests/casos-malos.json tiene un id repetido");
  process.exit(2);
}

const cuantas = (texto, parte) => texto.split(parte).length - 1;
let enCurso = null; // { archivo, original } para restaurar si se corta
const restaurar = () => {
  if (enCurso) fs.writeFileSync(enCurso.archivo, enCurso.original);
  enCurso = null;
};
for (const s of ["SIGINT", "SIGTERM"])
  process.on(s, () => {
    restaurar();
    process.exit(130);
  });

const correr = (c) =>
  spawnSync("bash", ["-c", c.prueba], {
    encoding: "utf8",
    timeout: (c.lenta ? 600 : 120) * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
const elegidas = lista.filter((c) =>
  solo ? c.id === solo : lentas || !c.lenta,
);

// Antes de romper nada, cada prueba tiene que PASAR. Si ya falla sola, que
// "detecte" una rotura no demuestra nada.
const sanas = new Map();
for (const c of elegidas) {
  if (sanas.has(c.prueba)) continue;
  const r = correr(c);
  sanas.set(c.prueba, r.status === 0);
  if (r.status !== 0) {
    console.error(
      `✗ La prueba ya falla sin romper nada: ${c.prueba}\n  Primero se arregla eso.`,
    );
    process.exit(2);
  }
}
console.log(
  `Pruebas sanas antes de empezar: ${sanas.size}. Aplicando ${elegidas.length} roturas…\n`,
);

const resultado = {
  detectadas: 0,
  sobreviven: [],
  noAplican: [],
  salteadas: 0,
};
for (const c of lista) {
  if (solo ? c.id !== solo : c.lenta && !lentas) {
    if (!solo) resultado.salteadas++;
    continue;
  }
  const original = fs.readFileSync(c.archivo);
  const texto = original.toString("utf8");
  let roto;
  if (c.agregar) roto = texto + c.agregar;
  else {
    if (cuantas(texto, c.buscar) !== 1) {
      console.log(
        `✗ NO APLICA  ${c.id}: el texto a romper aparece ${cuantas(texto, c.buscar)} veces en ${c.archivo} (tiene que ser 1)`,
      );
      resultado.noAplican.push(c.id);
      continue;
    }
    roto = texto.replace(c.buscar, () => c.reemplazar);
  }
  enCurso = { archivo: c.archivo, original };
  fs.writeFileSync(c.archivo, roto);
  let r;
  try {
    r = correr(c);
  } finally {
    restaurar();
  }
  if (!fs.readFileSync(c.archivo).equals(original)) {
    console.error(
      `✗ ${c.archivo} no quedó igual después de restaurar: revisar con git diff`,
    );
    process.exit(2);
  }
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const fallo = r.status !== 0;
  // "debeDecir": la falla tiene que ser la esperada, no una cualquiera
  const laEsperada = !c.debeDecir || new RegExp(c.debeDecir).test(salida);
  if (fallo && laEsperada) {
    console.log(`✓ detectada  ${c.id}: ${c.regla}`);
    resultado.detectadas++;
  } else {
    console.log(
      `✗ SOBREVIVE  ${c.id}: ${c.regla}\n     rompí: ${c.archivo} · corrí: ${c.prueba}\n     ${fallo ? `falló, pero no por lo esperado (/${c.debeDecir}/)` : "la prueba pasó igual"}`,
    );
    resultado.sobreviven.push(c.id);
  }
}

const mal = resultado.sobreviven.length + resultado.noAplican.length;
console.log(
  `\nRoturas detectadas: ${resultado.detectadas} · sobreviven: ${resultado.sobreviven.length} · no aplican: ${resultado.noAplican.length}` +
    (resultado.salteadas
      ? ` · lentas sin correr: ${resultado.salteadas} (--lentas)`
      : ""),
);
console.log(
  mal
    ? "✗ Hay reglas que se pueden romper sin que ninguna prueba avise."
    : "✓ Cada rotura fue detectada por su prueba.",
);
process.exit(mal ? 1 : 0);
