// Dibuja la imagen para Instagram en un <canvas> (en el celular o la compu de
// la dueña: no se manda a ningún servicio). Diseño aprobado el 11/11/2026:
//   · "vitrina": foto en círculo, nombre en dos renglones (el segundo en
//     cursiva rosa), "desde $" discreto, logo chico arriba.
//   · "portada": foto grande, franja con el nombre y el precio en pastilla.
//   · "poster" (13/11): foto de fondo entera, degradé abajo, nombre centrado,
//     línea con corazón, pastilla bordó y líneas finas en las esquinas.
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
    bordo: "#9b2747",
  },
  chocolate: {
    fondo: "#3b2420",
    texto: "#fbf5ee",
    suave: "#d9c6bc",
    cursiva: "#f3a6bd",
    bordo: "#c4466f",
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

// Dónde va la foto en cada modelo (en píxeles del lienzo).
export function zonaFoto({ modelo, formato, circulo = 1 }) {
  const { w, h } = FORMATOS[formato] ?? FORMATOS.cuadrado;
  if (modelo === "vitrina") {
    const d = (h > w ? 800 : 560) * circulo;
    return { w: d, h: d };
  }
  if (modelo === "portada") return { w, h: h - (h > w ? 470 : 250) };
  return { w, h };
}

// Arrastrar la foto sobre la vista previa: dx/dy en píxeles del lienzo.
// Mover la foto a la derecha deja ver más de su lado izquierdo.
export function moverFoto(enc, dx, dy, img, zona) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = Math.max(1, enc.zoom ?? 1);
  const escala = Math.max(zona.w / iw, zona.h / ih) * zoom;
  const x = (enc.x ?? 50) - (dx / escala / iw) * 100;
  const y = (enc.y ?? 50) - (dy / escala / ih) * 100;
  // límites: el centro no puede ir más allá de donde la foto ya no cubre
  const mx = (zona.w / escala / iw) * 50;
  const my = (zona.h / escala / ih) * 50;
  const entre = (v, a, b) => Math.min(Math.max(v, a), b);
  return {
    zoom,
    x: mx >= 50 ? 50 : entre(x, mx, 100 - mx),
    y: my >= 50 ? 50 : entre(y, my, 100 - my),
  };
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

function dibujarVitrina(ctx, { w, h }, c, img, logo, t, enc, circulo = 1) {
  const historia = h > w;
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, w, h);

  const logoD = historia ? 130 : 104;
  dibujarLogo(ctx, logo, w / 2, historia ? 170 : 92, logoD, false);

  const d = (historia ? 800 : 560) * circulo;
  const cx = w / 2;
  // el círculo más grande sube un poco; el texto siempre va debajo
  const arriba = historia
    ? 330 - (circulo - 1) * 200
    : 186 - (circulo - 1) * 120;
  const cy = arriba + d / 2;
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
  let y = cy + d / 2 + (historia ? 190 : 120) - (circulo - 1) * 50;
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

// Líneas finas y curvas que entran por las esquinas
function lineasEsquina(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = Math.max(2, w * 0.0025);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.11);
  ctx.bezierCurveTo(w * 0.18, h * 0.1, w * 0.3, h * 0.05, w * 0.37, 0);
  ctx.moveTo(0, h * 0.09);
  ctx.bezierCurveTo(w * 0.1, h * 0.06, w * 0.22, h * 0.03, w * 0.27, 0);
  ctx.moveTo(w, h * 0.89);
  ctx.bezierCurveTo(w * 0.82, h * 0.9, w * 0.7, h * 0.95, w * 0.63, h);
  ctx.moveTo(w, h * 0.91);
  ctx.bezierCurveTo(w * 0.9, h * 0.94, w * 0.78, h * 0.97, w * 0.73, h);
  ctx.stroke();
  ctx.restore();
}

function corazon(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(
    cx - s * 0.9,
    cy - s * 0.25,
    cx - s * 0.45,
    cy - s * 0.85,
    cx,
    cy - s * 0.35,
  );
  ctx.bezierCurveTo(
    cx + s * 0.45,
    cy - s * 0.85,
    cx + s * 0.9,
    cy - s * 0.25,
    cx,
    cy + s * 0.35,
  );
  ctx.fill();
  ctx.restore();
}

function dibujarPoster(ctx, { w, h }, c, img, logo, t, enc) {
  const historia = h > w;
  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, w, h);
  if (img) dibujarFoto(ctx, img, 0, 0, w, h, enc);

  // degradé hacia el color de fondo, para que el texto se lea sobre la foto
  const desde = h * (historia ? 0.42 : 0.3);
  const hasta = h * (historia ? 0.7 : 0.64);
  const g = ctx.createLinearGradient(0, desde, 0, hasta);
  const rgb = c.fondo === "#fbf5ee" ? "251,245,238" : "59,36,32";
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(0.35, `rgba(${rgb},0.35)`);
  g.addColorStop(0.7, `rgba(${rgb},0.8)`);
  g.addColorStop(1, `rgba(${rgb},0.97)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, desde, w, h - desde);
  ctx.fillStyle = `rgba(${rgb},0.97)`;
  ctx.fillRect(0, hasta, w, h - hasta);

  lineasEsquina(ctx, w, h, c.bordo);
  dibujarLogo(
    ctx,
    logo,
    w / 2,
    historia ? 165 : 92,
    historia ? 150 : 104,
    true,
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const cx = w / 2;
  const max = w - 140;
  const base = historia ? 124 : 82;
  let y = h * (historia ? 0.74 : 0.7);
  if (!t.linea2) y += base * 0.5;
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
    y += s1 * 1.08;
  }
  if (t.linea2) {
    const s2 = letraQueEntra(
      ctx,
      t.linea2,
      (n) => `italic 500 ${n}px ${DISPLAY}`,
      base + 14,
      max,
    );
    ctx.fillStyle = c.bordo;
    ctx.fillText(t.linea2, cx, y);
    y += s2 * 0.55;
  }

  // línea con corazón
  y += historia ? 60 : 34;
  const largo = historia ? 230 : 170;
  ctx.save();
  ctx.strokeStyle = c.cursiva;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 30 - largo, y);
  ctx.lineTo(cx - 30, y);
  ctx.moveTo(cx + 30, y);
  ctx.lineTo(cx + 30 + largo, y);
  ctx.stroke();
  ctx.restore();
  corazon(ctx, cx, y, historia ? 30 : 24, c.cursiva);

  // pastilla bordó
  const pastillaTexto = t.precio ? `${t.desde ? "desde " : ""}${t.precio}` : "";
  if (pastillaTexto) {
    const pt = historia ? 52 : 38;
    ctx.font = `700 ${pt}px ${TEXTO}`;
    const ancho = ctx.measureText(pastillaTexto).width + pt * 2.2;
    const alto = pt * 2;
    const py = y + (historia ? 60 : 38);
    ctx.beginPath();
    ctx.roundRect(cx - ancho / 2, py, ancho, alto, alto / 2);
    ctx.fillStyle = c.bordo;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(pastillaTexto, cx, py + alto / 2 + 2);
    ctx.textBaseline = "alphabetic";
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{modelo:"vitrina"|"portada", color:"crema"|"chocolate",
 *          formato:"cuadrado"|"historia", foto?:CanvasImageSource, logo?:CanvasImageSource,
 *          circulo?:number (tamaño del círculo de "vitrina", 0.8 a 1.2),
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
  else if (o.modelo === "poster")
    dibujarPoster(ctx, tam, c, o.foto, o.logo, t, o.encuadre);
  else dibujarVitrina(ctx, tam, c, o.foto, o.logo, t, o.encuadre, o.circulo);
}
