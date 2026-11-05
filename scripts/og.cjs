// Arma la imagen para compartir (public/og-8.jpg, 1200×630) con fotos REALES.
// El nombre lleva número: WhatsApp guarda la imagen vieja; al cambiarla, subir el número (y en index.html).
// WhatsApp recorta los costados (y a veces deja solo el cuadrado del centro):
// todo va al centro: la foto grande y el logo real de Amoma (sin fondo blanco).
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
    .extract({ left: 0, top: 350, width: 736, height: 560 })
    .resize(1240, 943, { kernel: "lanczos3" })
    .jpeg({ quality: 92 })
    .toBuffer();
  // logo real SIN el fondo blanco: solo el rosa (el blanco pasa a transparente)
  const { data, info } = await sharp(path.join(raiz, "public/logo.png"))
    .extract({ left: 48, top: 42, width: 305, height: 313 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    rgba.set([252, 124, 157], j); // rosa del logo
    rgba[j + 3] = Math.max(0, Math.min(255, ((255 - data[i + 1]) / 131) * 255));
  }
  const logo = (
    await sharp(rgba, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer()
  ).toString("base64");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{width:1200px;height:630px;background:#2a1915;position:relative;overflow:hidden}
    /* fondo: la misma foto desenfocada (lo que se ve alrededor también es torta) */
    .fondo{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(28px) brightness(.55)}
    .foto{position:absolute;left:600px;top:10px;width:810px;height:616px;margin-left:-405px;border-radius:24px;overflow:hidden;
      box-shadow:0 30px 60px -20px rgb(0 0 0/70%)}
    .foto img{width:100%;height:100%;object-fit:cover}
    /* abajo de la foto, un oscurecido suave para que el logo rosa se lea */
    .foto::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 58%,rgb(15 8 6/80%))}
    .sello{position:absolute;left:525px;top:462px;width:150px;height:154px;filter:drop-shadow(0 2px 6px rgb(0 0 0/70%))}
    .sello img{width:100%;height:100%}
  </style></head><body>
    <div class="fondo" style="background-image:url(data:image/jpeg;base64,${foto.toString("base64")})"></div>
    <div class="foto"><img src="data:image/jpeg;base64,${foto.toString("base64")}"></div>
    <div class="sello"><img src="data:image/png;base64,${logo}"></div>
  </body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  const png = await p.screenshot({ type: "png" });
  await b.close();
  const salida = path.join(raiz, "public/og-8.jpg");
  await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(salida);
  console.log(
    "public/og-8.jpg",
    Math.round(fs.statSync(salida).size / 1024),
    "KB",
  );
})();
