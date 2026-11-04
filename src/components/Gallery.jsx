import { useEffect, useRef, useState } from "react";
import Picture from "./Picture";
import Reveal from "./Reveal";
import Icon from "./Icon";
import { useSitio } from "../lib/sitio";
import "../styles/Gallery.css";

function Gallery() {
  const { galeria } = useSitio();
  // índice de la foto abierta (null = ninguna)
  const [abierta, setAbierta] = useState(null);
  const dialogRef = useRef(null);
  const toqueX = useRef(null);

  const total = galeria.length;
  const mover = (paso) => setAbierta((i) => (i + paso + total) % total);

  // <dialog> nativo: atrapa el foco, cierra con Escape y es accesible
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (abierta !== null && !d.open) d.showModal();
    if (abierta === null && d.open) d.close();
  }, [abierta]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") mover(1);
    if (e.key === "ArrowLeft") mover(-1);
  };

  // deslizar con el dedo
  const onTouchStart = (e) => (toqueX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (toqueX.current === null) return;
    const dx = e.changedTouches[0].clientX - toqueX.current;
    if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
    toqueX.current = null;
  };

  const foto = abierta !== null ? galeria[abierta] : null;

  return (
    <section className="galeria seccion">
      <div className="contenedor">
        <Reveal className="galeria__cabecera">
          <p className="eyebrow">Galería</p>
          <h1>
            Hechas con <em>amor</em>
          </h1>
          <p className="lead">
            Algunos de los trabajos que salieron de nuestra cocina.
          </p>
        </Reveal>

        <ul className="galeria__grid">
          {galeria.map((f, i) => (
            <Reveal as="li" key={f.src || f.alt} delay={(i % 3) * 80}>
              <button
                type="button"
                className="galeria__foto"
                onClick={() => setAbierta(i)}
              >
                <Picture
                  foto={f}
                  sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 45vw, 92vw"
                />
                <span className="sr-only">Ampliar: {f.alt}</span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="visor"
        aria-label="Foto ampliada"
        onClose={() => setAbierta(null)}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.target === e.currentTarget && setAbierta(null)}
      >
        {foto && (
          <figure className="visor__figura" key={abierta}>
            <Picture foto={foto} sizes="92vw" loading="eager" />
            <figcaption>
              {foto.alt}
              <span className="visor__contador">
                {abierta + 1} / {total}
              </span>
            </figcaption>
          </figure>
        )}
        <button
          type="button"
          className="visor__btn visor__cerrar"
          onClick={() => setAbierta(null)}
          autoFocus
        >
          <Icon name="close" />
          <span className="sr-only">Cerrar</span>
        </button>
        <button
          type="button"
          className="visor__btn visor__prev"
          onClick={() => mover(-1)}
        >
          <Icon name="chevronLeft" />
          <span className="sr-only">Anterior</span>
        </button>
        <button
          type="button"
          className="visor__btn visor__next"
          onClick={() => mover(1)}
        >
          <Icon name="chevronRight" />
          <span className="sr-only">Siguiente</span>
        </button>
      </dialog>
    </section>
  );
}

export default Gallery;
