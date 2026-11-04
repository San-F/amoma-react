import { Link } from "react-router-dom";
import Palabras from "../components/Palabras";
import Picture from "../components/Picture";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { categorias } from "../data/catalog";
import "../styles/Categories.css";

function Categories() {
  return (
    <section className="categorias seccion" aria-labelledby="cat-titulo">
      <div className="contenedor">
        <Reveal className="cabecera">
          <p className="eyebrow">Lo que hacemos</p>
          <h2 id="cat-titulo">
            <Palabras>
              Elegí por dónde <em>empezar</em>
            </Palabras>
          </h2>
        </Reveal>
      </div>

      <ul className="categorias__lista">
        {categorias.map((c, i) => (
          <Reveal as="li" key={c.id} delay={i * 110} className="categoria">
            <Link
              to={c.destino}
              className="categoria__link descubrir"
              viewTransition
            >
              <div className="categoria__foto">
                <Picture foto={c.foto} sizes="(min-width: 64rem) 24rem, 80vw" />
              </div>
              <div className="categoria__texto">
                <span className="categoria__num">0{i + 1}</span>
                <h3>{c.nombre}</h3>
                <p>{c.descripcion}</p>
                <span className="categoria__ver">
                  Ver <Icon name="arrow" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export default Categories;
