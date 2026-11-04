// Achica y convierte fotos a WebP en el navegador antes de subirlas.
// Una foto de celular de 8 MB queda en ~200 KB sin pérdida visible.

const TIPOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];
export const MAX_ORIGINAL = 25 * 1024 * 1024; // 25 MB

export function validarImagen(file) {
  if (
    !file.type.startsWith("image/") ||
    (file.type && !TIPOS.includes(file.type) && file.type !== "")
  ) {
    return `"${file.name}" no es una imagen válida (JPG, PNG, WebP).`;
  }
  if (file.size > MAX_ORIGINAL)
    return `"${file.name}" pesa demasiado (máx. 25 MB).`;
  return null;
}

export async function comprimirImagen(
  file,
  { lado = 1600, calidad = 0.82 } = {},
) {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((ok, mal) =>
    canvas.toBlob(
      (b) => (b ? ok(b) : mal(new Error("No se pudo procesar la imagen"))),
      "image/webp",
      calidad,
    ),
  );
  return { blob, width: w, height: h };
}

// Nombre de archivo generado (nunca el original: evita rutas raras y datos personales)
export function rutaNueva(carpeta) {
  return `${carpeta}/${crypto.randomUUID()}.webp`;
}
