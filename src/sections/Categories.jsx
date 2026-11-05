import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { irA } from "../lib/scroll";
import Palabras from "../components/Palabras";
import Picture from "../components/Picture";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { categorias } from "../data/catalog";
import "../styles/Categories.css";

// Al pasar por una tarjeta (mouse/teclado) o deslizar hasta ella (celular),
// el fondo de toda la sección toma el tono de esa foto.
function Categories() {
  const [activa, setActiva] = useState(null);
  const navigate = useNavigate();

  // filtra el catálogo y baja suave hasta él (o hasta "personalizada")
  const abrirCategoria = (e, c) => {
    e.preventDefault();
    const [ruta, ancla] = c.destino.split("#");
    navigate(ruta, { replace: true, preventScrollReset: true });
    requestAnimationFrame(() => irA(`#${ancla}`));
  };
  const listaRef = useRef(null);

  // celular: la tarjeta activa es la que quedó alineada al deslizar
  useEffect(() => {
    const lista = listaRef.current;
    const tactil = window.matchMedia("(hover: none)").matches;
    if (!lista || !tactil) return;
    let cuadro = 0;
    const alDeslizar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const tarjeta = lista.firstElementChild;
        if (!tarjeta) return;
        const paso = tarjeta.getBoundingClientRect().width + 16;
        setActiva(
          Math.min(categorias.length - 1, Math.round(lista.scrollLeft / paso)),
        );
      });
    };
    lista.addEventListener("scroll", alDeslizar, { passive: true });
    return () => {
      lista.removeEventListener("scroll", alDeslizar);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  const tono = activa !== null ? categorias[activa].tono : null;
  const estilo = tono
    ? {
        "--amb-fondo": tono.fondo,
        "--amb-texto": tono.texto,
        "--amb-acento": tono.acento,
      }
    : undefined;

  return (
    <section
      className={`categorias seccion ${tono ? "categorias--activa" : ""}`}
      style={estilo}
      aria-labelledby="cat-titulo"
    >
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

      <ul
        className="categorias__lista"
        ref={listaRef}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActiva(null)}
      >
        {categorias.map((c, i) => (
          <Reveal
            as="li"
            key={c.id}
            delay={i * 110}
            className={`categoria ${activa === i ? "is-activa" : ""}`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActiva(i)}
          >
            <Link
              to={c.destino}
              className="categoria__link descubrir"
              onClick={(e) => abrirCategoria(e, c)}
              onFocus={() => setActiva(i)}
              onBlur={() => setActiva(null)}
            >
              <div className="categoria__foto">
                <Picture foto={c.foto} sizes="(min-width: 64rem) 18rem, 80vw" />
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
