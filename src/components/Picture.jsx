// Muestra una foto optimizada (AVIF → WebP → JPEG) con srcset.
// `sizes` le dice al navegador qué ancho ocupa, para que baje el archivo justo.
function Picture({
  foto,
  sizes = "100vw",
  className,
  loading = "lazy",
  fetchPriority,
}) {
  const { sources, img } = foto.picture;
  return (
    <picture className={className}>
      {Object.entries(sources).map(([format, srcset]) => (
        <source
          key={format}
          type={`image/${format}`}
          srcSet={srcset}
          sizes={sizes}
        />
      ))}
      <img
        src={img.src}
        width={img.w}
        height={img.h}
        alt={foto.alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </picture>
  );
}

export default Picture;
