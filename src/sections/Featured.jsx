import Picture from "../components/Picture";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { destacados } from "../data/catalog";
import { linkWhatsApp } from "../lib/whatsapp";
import "../styles/Featured.css";

function Featured() {
  return (
    <section className="destacados seccion" aria-labelledby="destacados-titulo">
      <div className="contenedor">
        <Reveal className="destacados__cabecera">
          <div>
            <p className="eyebrow">Las favoritas</p>
            <h2 id="destacados-titulo">
              Clásicos de <em>la casa</em>
            </h2>
          </div>
          <p className="lead">Las que más nos piden. Deslizá para ver todas.</p>
        </Reveal>
      </div>

      {/* en celular: carrusel que se desliza con el dedo; en desktop: grilla */}
      <ul className="destacados__lista">
        {destacados.map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 90} className="producto">
            <div className="producto__foto">
              <Picture foto={p.foto} sizes="(min-width: 64rem) 17rem, 75vw" />
            </div>
            <p className="producto__cat">{p.categoria}</p>
            <h3>{p.nombre}</h3>
            <p className="producto__desc">{p.descripcion}</p>
            <a
              className="producto__link"
              href={linkWhatsApp(
                `¡Hola Amoma! Quería consultar por: ${p.nombre}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar <Icon name="arrow" />
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export default Featured;
