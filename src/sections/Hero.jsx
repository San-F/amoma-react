import { Link } from "react-router-dom";
import Picture from "../components/Picture";
import { fotos } from "../data/images";
import { negocio } from "../data/catalog";
import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner contenedor">
        <div className="hero__texto">
          <p className="eyebrow hero__anim" style={{ "--d": "0ms" }}>
            Pastelería casera · {negocio.zona}
          </p>
          <h1 className="hero__titulo hero__anim" style={{ "--d": "80ms" }}>
            Tortas hechas a mano, <em>como en casa.</em>
          </h1>
          <p className="lead hero__anim" style={{ "--d": "180ms" }}>
            Elegí cada capa, contanos la fecha y la hacemos para vos.{" "}
            {negocio.lema}.
          </p>
          <div className="hero__ctas hero__anim" style={{ "--d": "280ms" }}>
            <a href="#arma-tu-torta" className="btn btn--rosa">
              Armá tu torta
            </a>
            <Link to="/galeria" className="btn btn--borde">
              Ver trabajos
            </Link>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__arco">
            <Picture
              foto={fotos.frutosRojos}
              sizes="(min-width: 64rem) 34rem, 90vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <p className="hero__sello" aria-hidden="true">
            <span>hecho</span>
            <span>con amor</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
