// Dibuja la imagen para Instagram en un <canvas> (en el celular o la compu de
// la dueña: no se manda a ningún servicio). Diseño aprobado el 11/11/2026:
//   · "vitrina": foto en círculo, nombre en dos renglones (el segundo en
//     cursiva rosa), "desde $" discreto, logo chico arriba.
//   · "portada": foto grande, franja con el nombre y el precio en pastilla.
// Cada una en crema o chocolate, y en cuadrado (1080×1080) o historia (1080×1920).

export const FORMATOS = {
  cuadrado: { w: 1080, h: 1080 },
  historia: { w: 1080, h: 1920 },
};

export const COLORES = {
  crema: {
    fondo: "#fbf5ee",
    texto: "#3b2420",
    suave: "#6d5650",
    cursiva: "#a83e5f",
  },
  chocolate: {
    fondo: "#3b2420",
    texto: "#fbf5ee",
    suave: "#d9c6bc",
    cursiva: "#f3a6bd",
  },
};

const ROSA_BOTON = "#c4466f";
const DISPLAY = '"Fraunces Variable", Georgia, serif';
const TEXTO = '"Manrope Variable", system-ui, sans-serif';

// "Torta de frutos rojos" → ["Torta de", "frutos rojos"]
export function partirNombre(nombre) {
  const palabras = String(nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (palabras.length < 2) return [palabras.join(" "), ""];
  const de = palabras.findIndex((p, i) => i > 0 && /^(de|del|con|y)$/i.test(p));
  const corte =
    de > 0 && de < palabras.length - 1
      ? de + 1
      : Math.ceil(palabras.length / 2);
  return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
}

// Espera a que estén las letras (si no, el canvas usa otra y queda distinto).
export async function cargarLetras() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`500 80px ${DISPLAY}`),
    document.fonts.load(`italic 500 80px ${DISPLAY}`),
    document.fonts.load(`700 40px ${TEXTO}`),
    document.fonts.load(`500 40px ${TEXTO}`),
  ]).catch(() => {});
}

export function cargarImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    // las fotos de la base vienen de otro dominio: sin esto no se pueden
    // exportar (el navegador "ensucia" el canvas)
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error("No se pudo cargar la foto."));
    img.src = src;
  });
}

// Achica la letra hasta que el texto entre en el ancho.
function letraQueEntra(ctx, texto, fuente, tamano, maxAncho) {
  let t = tamano;
  ctx.font = fuente(t);
  while (t > 20 && ctx.measureText(texto).width > maxAncho) {
    t -= 2;
    ctx.font = fuente(t);
  }
  return t;
}

// Dibuja la foto cubriendo el recuadro, respetando el encuadre elegido en el
// panel (punto central x/y en % y zoom), igual que en la página.
function dibujarFoto(ctx, img, x, y, w, h, enc = {}) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = Math.max(1, enc.zoom ?? 1);
  const escala = Math.max(w / iw, h / ih) * zoom;
  const sw = w / escala;
  const sh = h / escala;
  const cx = ((enc.x ?? 50) / 100) * iw;
  const cy = ((enc.y ?? 50) / 100) * ih;
  const sx = Math.min(Math.max(cx - sw / 2, 0), iw - sw);
  const sy = Math.min(Math.max(cy - sh / 2, 0), ih - sh);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Logo siempre redondo y en su proporción (es cuadrado: ancho = alto).
function dibujarLogo(ctx, logo, cx, cy, d, sombra) {
  if (!logo) return;
  ctx.save();
  if (sombra) {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = d * 0.25;
    ctx.shadowOffsetY = d * 0.06;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2 - 2, 0, Math.PI * 2);
  ctx.clip();
  const lado = d * 0.92;
  ctx.drawImage(logo, cx - lado / 2, cy - lado / 2, lado, lado);
  ctx.restore();
}

function dibujarVitrina(ctx, { w, h }, c, img, logo, t, enc) {
  const historia = h > w;
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, w, h);

  const logoD = historia ? 130 : 104;
  dibujarLogo(ctx, logo, w / 2, historia ? 170 : 92, logoD, false);

  const d = historia ? 800 : 560;
  const cx = w / 2;
  const cy = historia ? 330 + d / 2 : 186 + d / 2;
  // aro blanco con sombra suave
  ctx.save();
  ctx.shadowColor = "rgba(59,36,32,0.35)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2 + 14, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.clip();
  if (img) dibujarFoto(ctx, img, cx - d / 2, cy - d / 2, d, d, enc);
  ctx.restore();

  // texto
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const max = w - 140;
  const base = historia ? 108 : 76;
  let y = cy + d / 2 + (historia ? 190 : 120);
  if (t.linea1) {
    const s1 = letraQueEntra(
      ctx,
      t.linea1,
      (n) => `500 ${n}px ${DISPLAY}`,
      base,
      max,
    );
    ctx.fillStyle = c.texto;
    ctx.fillText(t.linea1, cx, y);
    y += s1 * (t.linea2 ? 1.02 : 1.2);
  }
  if (t.linea2) {
    const s2 = letraQueEntra(
      ctx,
      t.linea2,
      (n) => `italic 500 ${n}px ${DISPLAY}`,
      base + 6,
      max,
    );
    ctx.fillStyle = c.cursiva;
    ctx.fillText(t.linea2, cx, y);
    y += s2 * 0.95;
  }
  if (t.precio) {
    y += historia ? 40 : 18;
    const chico = historia ? 40 : 30;
    const grande = historia ? 66 : 50;
    ctx.font = `500 ${chico}px ${TEXTO}`;
    const a = t.desde ? "desde  " : "";
    const wa = a ? ctx.measureText(a).width : 0;
    ctx.font = `600 ${grande}px ${DISPLAY}`;
    const wb = ctx.measureText(t.precio).width;
    let x = cx - (wa + wb) / 2;
    ctx.textAlign = "left";
    if (a) {
      ctx.font = `500 ${chico}px ${TEXTO}`;
      ctx.fillStyle = c.suave;
      ctx.fillText(a, x, y);
      x += wa;
    }
    ctx.font = `600 ${grande}px ${DISPLAY}`;
    ctx.fillStyle = c.texto;
    ctx.fillText(t.precio, x, y);
  }
}

function dibujarPortada(ctx, { w, h }, c, img, logo, t, enc) {
  const historia = h > w;
  const franja = historia ? 470 : 250;
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, w, h);
  if (img) dibujarFoto(ctx, img, 0, 0, w, h - franja, enc);
  dibujarLogo(ctx, logo, w / 2, historia ? 150 : 84, historia ? 120 : 96, true);

  const m = 70; // margen
  const arriba = h - franja;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // pastilla del precio
  let anchoPastilla = 0;
  const pastillaTexto = t.precio ? `${t.desde ? "desde " : ""}${t.precio}` : "";
  const pt = historia ? 44 : 34;
  if (pastillaTexto) {
    ctx.font = `700 ${pt}px ${TEXTO}`;
    anchoPastilla = ctx.measureText(pastillaTexto).width + pt * 1.4;
  }

  // nombre: en cuadrado comparte renglón con la pastilla; en historia va arriba
  const maxNombre = historia ? w - m * 2 : w - m * 2 - anchoPastilla - 30;
  const base = historia ? 96 : 62;
  let y = arriba + (historia ? 150 : t.linea2 ? 100 : 140);
  if (t.linea1) {
    const s1 = letraQueEntra(
      ctx,
      t.linea1,
      (n) => `500 ${n}px ${DISPLAY}`,
      base,
      maxNombre,
    );
    ctx.fillStyle = c.texto;
    ctx.fillText(t.linea1, m, y);
    y += s1 * 1.05;
  }
  if (t.linea2) {
    letraQueEntra(
      ctx,
      t.linea2,
      (n) => `italic 500 ${n}px ${DISPLAY}`,
      base + 4,
      maxNombre,
    );
    ctx.fillStyle = c.cursiva;
    ctx.fillText(t.linea2, m, y);
  }

  if (pastillaTexto) {
    const alto = pt * 2;
    const px = historia ? m : w - m - anchoPastilla;
    const py = historia ? y + 70 : arriba + franja / 2 - alto / 2;
    ctx.beginPath();
    ctx.roundRect(px, py, anchoPastilla, alto, alto / 2);
    ctx.fillStyle = ROSA_BOTON;
    ctx.fill();
    ctx.font = `700 ${pt}px ${TEXTO}`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(pastillaTexto, px + pt * 0.7, py + alto / 2 + 2);
    ctx.textBaseline = "alphabetic";
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{modelo:"vitrina"|"portada", color:"crema"|"chocolate",
 *          formato:"cuadrado"|"historia", foto?:CanvasImageSource, logo?:CanvasImageSource,
 *          encuadre?:{x:number,y:number,zoom:number},
 *          textos:{linea1:string, linea2:string, precio:string, desde:boolean}}} o
 */
export function dibujarPublicacion(canvas, o) {
  const tam = FORMATOS[o.formato] ?? FORMATOS.cuadrado;
  canvas.width = tam.w;
  canvas.height = tam.h;
  const ctx = canvas.getContext("2d");
  const c = COLORES[o.color] ?? COLORES.crema;
  const t = {
    linea1: (o.textos.linea1 ?? "").trim(),
    linea2: (o.textos.linea2 ?? "").trim(),
    precio: (o.textos.precio ?? "").trim(),
    desde: o.textos.desde,
  };
  if (o.modelo === "portada")
    dibujarPortada(ctx, tam, c, o.foto, o.logo, t, o.encuadre);
  else dibujarVitrina(ctx, tam, c, o.foto, o.logo, t, o.encuadre);
}
