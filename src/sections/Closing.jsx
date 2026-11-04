import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { negocio } from "../data/catalog";
import { linkWhatsApp } from "../lib/whatsapp";
import "../styles/Closing.css";

function Closing() {
  return (
    <section className="cierre seccion" aria-labelledby="cierre-titulo">
      <Reveal className="cierre__caja contenedor">
        <p className="eyebrow">Cumpleaños, casamientos, eventos</p>
        <h2 id="cierre-titulo">
          ¿Tenés algo para <em>festejar?</em>
        </h2>
        <p className="lead">
          Escribinos y la pensamos juntos. Respondemos por WhatsApp o Instagram.
        </p>
        <div className="cierre__ctas">
          <a
            className="btn btn--rosa"
            href={linkWhatsApp("¡Hola Amoma! Quería hacer una consulta.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" /> Escribinos
          </a>
          <a
            className="btn btn--borde cierre__ig"
            href={`https://www.instagram.com/${negocio.instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="instagram" /> @{negocio.instagram}
          </a>
        </div>
      </Reveal>
    </section>
  );
}

export default Closing;
