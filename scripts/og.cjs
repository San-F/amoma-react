// Arma la imagen para compartir (public/og-3.jpg, 1200×630) con fotos REALES.
// El nombre lleva número: WhatsApp guarda la imagen vieja; al cambiarla, subir el número (y en index.html).
// WhatsApp a veces muestra solo el cuadrado del centro: la torta va ahí,
// entera, y el texto a los costados. Uso: node scripts/og.cjs
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
    .halo{position:absolute;left:600px;top:315px;width:760px;height:760px;margin:-380px;border-radius:50%;
      background:radial-gradient(circle,#f8d3de 0 55%,transparent 70%)}
    .foto{position:absolute;left:600px;top:315px;width:560px;height:560px;margin:-280px;border-radius:50%;overflow:hidden;
      box-shadow:0 40px 60px -30px rgb(59 36 32/55%),0 0 0 10px #fff}
    .foto img{width:100%;height:100%;object-fit:cover}
    .izq,.der{position:absolute;top:0;bottom:0;width:270px;display:flex;flex-direction:column;justify-content:center}
    .izq{left:0;padding-left:44px}
    .der{right:0;padding-right:44px;text-align:right;align-items:flex-end}
    .marca{font-family:F;font-weight:600;font-size:76px;line-height:1;letter-spacing:-.02em;font-variation-settings:"opsz" 144}
    .linea{width:48px;height:3px;background:#c4466f;border-radius:2px;margin:22px 0 18px}
    .eyebrow{font-weight:800;font-size:17px;letter-spacing:.16em;color:#a83e5f}
    .frase{font-family:F;font-style:italic;font-size:40px;line-height:1.1;color:#a83e5f;font-variation-settings:"opsz" 144}
    .chico{margin-top:18px;font-size:19px;font-weight:600;color:#6d5650;line-height:1.35}
  </style></head><body>
    <div class="halo"></div>
    <div class="izq"><div class="marca">Amoma</div><div class="linea"></div><div class="eyebrow">PASTELERÍA<br>CASERA · CABA</div></div>
    <div class="foto"><img src="data:image/jpeg;base64,${foto.toString("base64")}"></div>
    <div class="der"><div class="frase">Hecho a mano,<br>como en casa</div><div class="chico">Tortas, tartas<br>y postres por encargo</div></div>
  </body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  const png = await p.screenshot({ type: "png" });
  await b.close();
  const salida = path.join(raiz, "public/og-3.jpg");
  await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(salida);
  console.log(
    "public/og-3.jpg",
    Math.round(fs.statSync(salida).size / 1024),
    "KB",
  );
})();
