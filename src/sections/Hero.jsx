import Picture from "../components/Picture";
import Palabras from "../components/Palabras";
import { fotos } from "../data/images";
import Icon from "../components/Icon";

import { linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import { irA } from "../lib/scroll";
import "../styles/Hero.css";

function Hero() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  return (
    <section className="hero">
      <div className="hero__inner contenedor">
        <div className="hero__texto">
          <h1 className="hero__titulo palabras--ya">
            <Palabras>
              Tortas hechas a mano, <em>como en casa.</em>
            </Palabras>
          </h1>
          <p className="lead hero__anim" style={{ "--d": "180ms" }}>
            Tortas, postres y salados caseros para tus festejos.
          </p>
          <div className="hero__ctas hero__anim" style={{ "--d": "280ms" }}>
            <a
              href="#tortas"
              className="btn btn--rosa"
              onClick={(e) => {
                e.preventDefault();
                irA("#tortas");
              }}
            >
              Ver catálogo <Icon name="arrow" />
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
          <div className="hero__sello" aria-hidden="true">
            {/* texto en círculo que gira lento, como un sello de pastelería */}
            <svg viewBox="0 0 100 100">
              <defs>
                <path
                  id="sello-circulo"
                  d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"
                />
              </defs>
              <text>
                <textPath
                  href="#sello-circulo"
                  textLength="230"
                  lengthAdjust="spacing"
                >
                  hecho con amor ✦ casero ✦ hecho con amor ✦ casero ✦
                </textPath>
              </text>
            </svg>
            <span className="hero__corazon">♥</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
