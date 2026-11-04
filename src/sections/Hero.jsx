import Picture from "../components/Picture";
import { fotos } from "../data/images";
import Icon from "../components/Icon";

import { linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import "../styles/Hero.css";

function Hero() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
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
            Tortas, tartas y postres para cumpleaños, eventos y antojos.{" "}
            {negocio.lema}.
          </p>
          <div className="hero__ctas hero__anim" style={{ "--d": "280ms" }}>
            <a href="#tortas" className="btn btn--rosa">
              Ver tortas <Icon name="arrow" />
            </a>
            <a
              className="btn btn--borde"
              href={wa("¡Hola Amoma! Quería hacer un pedido.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="whatsapp" /> Pedir por WhatsApp
            </a>
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
