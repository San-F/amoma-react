// Arma la imagen para compartir (public/og-6.jpg, 1200×630) con fotos REALES.
// El nombre lleva número: WhatsApp guarda la imagen vieja; al cambiarla, subir el número (y en index.html).
// WhatsApp recorta los costados (y a veces deja solo el cuadrado del centro):
// todo va al centro: la foto y el logo real de Amoma como sello.
// Uso: node scripts/og.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const raiz = path.join(__dirname, "..");
const b64 = (p) => fs.readFileSync(path.join(raiz, p)).toString("base64");

(async () => {
  // porción de torta de chocolate (foto de la tarjeta "Tortas"), apaisada
  const foto = await sharp(path.join(raiz, "src/assets/img/hero.jpg"))
    .extract({ left: 0, top: 380, width: 736, height: 518 })
    .resize(1280, 900, { kernel: "lanczos3" })
    .jpeg({ quality: 92 })
    .toBuffer();
  const logo = fs
    .readFileSync(path.join(raiz, "public/logo.png"))
    .toString("base64");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{width:1200px;height:630px;background:#3b2420;position:relative;overflow:hidden}
    .halo{position:absolute;left:600px;top:250px;width:760px;height:760px;margin:-380px;border-radius:50%;
      background:radial-gradient(circle,#4a2e28 0 50%,transparent 70%)}
    .foto{position:absolute;left:300px;top:34px;width:600px;height:430px;border-radius:28px;overflow:hidden;
      box-shadow:0 34px 50px -26px rgb(0 0 0/65%)}
    .foto img{width:100%;height:100%;object-fit:cover}
    /* sello con el logo real: el blanco termina justo en el aro rosa */
    .sello{position:absolute;left:600px;top:478px;width:150px;height:150px;margin:-75px;border-radius:50%;
      background:#fff;overflow:hidden;box-shadow:0 14px 26px -12px rgb(0 0 0/60%)}
    .sello img{width:100%;height:100%;object-fit:cover;transform:scale(1.2)}
  </style></head><body>
    <div class="halo"></div>
    <div class="foto"><img src="data:image/jpeg;base64,${foto.toString("base64")}"></div>
    <div class="sello"><img src="data:image/png;base64,${logo}"></div>
  </body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  const png = await p.screenshot({ type: "png" });
  await b.close();
  const salida = path.join(raiz, "public/og-6.jpg");
  await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(salida);
  console.log(
    "public/og-6.jpg",
    Math.round(fs.statSync(salida).size / 1024),
    "KB",
  );
})();
