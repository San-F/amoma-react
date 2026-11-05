import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { irA } from "../lib/scroll";
import { conTransicion } from "../lib/transicion";
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
  // celular: la tarjeta que quedó al frente del carrusel (arranca la primera)
  const [centrada, setCentrada] = useState(0);
  const navigate = useNavigate();

  const [portal, setPortal] = useState(null); // { c, fase: "abierto" | "saliendo" }
  const linksRef = useRef([]);

  // "Entrar" a la categoría: la tarjeta se expande a pantalla completa
  // (View Transitions), se lee el nombre, y se abre al catálogo ya filtrado.
  // Sin soporte o con "reducir movimiento": desplazamiento suave.
  const abrirCategoria = (e, c, i) => {
    e.preventDefault();
    const [ruta, ancla] = c.destino.split("#");
    const filtrar = () =>
      navigate(ruta, { replace: true, preventScrollReset: true });
    const menosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || menosMovimiento) {
      filtrar();
      requestAnimationFrame(() => irA(`#${ancla}`));
      return;
    }
    const tarjeta = linksRef.current[i];
    if (tarjeta) tarjeta.style.viewTransitionName = "portal";
    const t = conTransicion(() => {
      if (tarjeta) tarjeta.style.viewTransitionName = "";
      setPortal({ c, fase: "abierto" });
    }, "vt-portal");
    t?.finished.then(async () => {
      filtrar();
      await new Promise((ok) => setTimeout(ok, 420)); // un instante para leer el nombre
      // detrás del portal, saltamos al destino; después el portal "se abre"
      const destino = document.getElementById(ancla);
      if (destino)
        window.scrollTo(
          0,
          destino.getBoundingClientRect().top + window.scrollY - 16,
        );
      setPortal({ c, fase: "saliendo" });
    });
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
        const i = Math.min(
          categorias.length - 1,
          Math.round(lista.scrollLeft / paso),
        );
        setCentrada(i);
        setActiva(i);
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
            className={`categoria ${activa === i ? "is-activa" : ""} ${centrada === i ? "is-centrada" : ""}`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActiva(i)}
          >
            <Link
              to={c.destino}
              className="categoria__link descubrir"
              onClick={(e) => abrirCategoria(e, c, i)}
              ref={(el) => (linksRef.current[i] = el)}
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

      {portal && (
        <div
          className={`portal portal--${portal.fase}`}
          style={{ "--portal-fondo": portal.c.tono.fondo }}
          aria-hidden="true"
          onAnimationEnd={(e) =>
            e.target === e.currentTarget &&
            portal.fase === "saliendo" &&
            setPortal(null)
          }
        >
          <div className="portal__foto">
            <Picture foto={portal.c.foto} sizes="100vw" loading="eager" />
          </div>
          <p className="portal__titulo">{portal.c.nombre}</p>
        </div>
      )}
    </section>
  );
}

export default Categories;
