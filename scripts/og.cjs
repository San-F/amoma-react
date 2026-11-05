// Arma la imagen para compartir (public/og-4.jpg, 1200×630) con fotos REALES.
// El nombre lleva número: WhatsApp guarda la imagen vieja; al cambiarla, subir el número (y en index.html).
// WhatsApp recorta los costados (y a veces deja solo el cuadrado del centro):
// todo va al centro: la torta entera y UN solo texto ("Amoma").
// Uso: node scripts/og.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const raiz = path.join(__dirname, "..");
const b64 = (p) => fs.readFileSync(path.join(raiz, p)).toString("base64");

(async () => {
  // recorte cuadrado de la torta de rosetas blancas (opción C, elegida por el cliente)
  const foto = await sharp(path.join(raiz, "src/assets/img/torta-1.jpeg"))
    .extract({ left: 60, top: 60, width: 1080, height: 1080 })
    .resize(1120, 1120, { kernel: "lanczos3" })
    .jpeg({ quality: 92 })
    .toBuffer();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:F;src:url(data:font/woff2;base64,${b64("node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2")})}
    @font-face{font-family:F;font-style:italic;src:url(data:font/woff2;base64,${b64("node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2")})}
    @font-face{font-family:M;src:url(data:font/woff2;base64,${b64("node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2")})}
    *{margin:0;box-sizing:border-box}
    body{width:1200px;height:630px;background:#fbe3ea;color:#3b2420;font-family:M;position:relative;overflow:hidden}
    .halo{position:absolute;left:600px;top:265px;width:720px;height:720px;margin:-360px;border-radius:50%;
      background:radial-gradient(circle,#f8d3de 0 55%,transparent 70%)}
    .foto{position:absolute;left:600px;top:265px;width:470px;height:470px;margin:-235px;border-radius:50%;overflow:hidden;
      box-shadow:0 34px 50px -26px rgb(59 36 32/55%),0 0 0 9px #fff}
    .foto img{width:100%;height:100%;object-fit:cover}
    .marca{position:absolute;left:0;right:0;bottom:34px;text-align:center;font-family:F;font-weight:600;font-size:60px;
      line-height:1;letter-spacing:-.02em;font-variation-settings:"opsz" 144}
  </style></head><body>
    <div class="halo"></div>
    <div class="foto"><img src="data:image/jpeg;base64,${foto.toString("base64")}"></div>
    <div class="marca">Amoma</div>
  </body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  const png = await p.screenshot({ type: "png" });
  await b.close();
  const salida = path.join(raiz, "public/og-4.jpg");
  await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(salida);
  console.log(
    "public/og-4.jpg",
    Math.round(fs.statSync(salida).size / 1024),
    "KB",
  );
})();
