import { Link } from "react-router-dom";
import Picture from "../components/Picture";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { galeria } from "../data/catalog";
import "../styles/GalleryStrip.css";

// Mosaico de 5 trabajos reales + link a la galería completa.
function GalleryStrip() {
  const fotos = galeria.slice(1, 6);
  return (
    <section className="mosaico seccion" aria-labelledby="mosaico-titulo">
      <div className="contenedor">
        <Reveal className="mosaico__cabecera">
          <p className="eyebrow">Hechas por Amoma</p>
          <h2 id="mosaico-titulo">
            Cada torta, <em>una historia</em>
          </h2>
        </Reveal>

        <div className="mosaico__grid">
          {fotos.map((f, i) => (
            <Reveal
              key={f.alt}
              delay={i * 80}
              className={`mosaico__item mosaico__item--${i + 1}`}
            >
              <Picture foto={f} sizes="(min-width: 64rem) 24rem, 50vw" />
            </Reveal>
          ))}
        </div>

        <div className="mosaico__cta">
          <Link to="/galeria" className="btn btn--borde">
            Ver galería completa <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default GalleryStrip;
