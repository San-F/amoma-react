import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/img/logo.png?w=96&format=webp";
import { linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import "../styles/Navbar.css";

const LINKS = [
  { to: "/#tortas", texto: "Catálogo", ancla: true },
  { to: "/#personalizada", texto: "Personalizadas", ancla: true },
  { to: "/galeria", texto: "Galería" },
  { to: "/contacto", texto: "Contacto" },
];

function Navbar() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  const [abierto, setAbierto] = useState(false);
  const [conFondo, setConFondo] = useState(false);
  const [oculta, setOculta] = useState(false);
  const { pathname } = useLocation();

  // cerrar el menú al navegar
  useEffect(() => setAbierto(false), [pathname]);

  // la barra toma fondo al bajar un poco
  useEffect(() => {
    let ultimo = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setConFondo(y > 12);
      // se esconde al bajar (más pantalla para el contenido) y vuelve al subir
      if (Math.abs(y - ultimo) > 6) {
        setOculta(y > ultimo && y > 160);
        ultimo = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape cierra el menú
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <header
        className={`nav ${conFondo || abierto ? "nav--fondo" : ""} ${oculta && !abierto ? "nav--oculta" : ""}`}
      >
        <nav className="nav__barra contenedor" aria-label="Principal">
          <Link
            to="/"
            className="nav__logo"
            aria-label="Amoma, ir al inicio"
            viewTransition
          >
            <img src={logo} alt="" width="48" height="48" />
            <span>Amoma</span>
          </Link>

          <ul
            id="menu-principal"
            className={`nav__links ${abierto ? "is-open" : ""}`}
          >
            {LINKS.map((l) => (
              <li key={l.to}>
                {l.ancla ? (
                  <Link to={l.to} viewTransition>
                    {l.texto}
                  </Link>
                ) : (
                  <NavLink to={l.to} viewTransition>
                    {l.texto}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div className="nav__acciones">
            <a
              className="btn btn--rosa nav__cta"
              href={wa("¡Hola Amoma! Quería hacer un pedido.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Pedir
            </a>
            <button
              type="button"
              className="nav__toggle"
              aria-expanded={abierto}
              aria-controls="menu-principal"
              onClick={() => setAbierto((v) => !v)}
            >
              <span className="sr-only">
                {abierto ? "Cerrar menú" : "Abrir menú"}
              </span>
              <span className="nav__hamburguesa" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>
      {/* velo: desenfoca la página detrás del menú abierto; tocarlo lo cierra */}
      <div
        className={`nav__velo ${abierto ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setAbierto(false)}
      />
    </>
  );
}

export default Navbar;
