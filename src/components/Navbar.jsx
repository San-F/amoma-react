import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/img/logo.png?w=96&format=webp";
import { linkWhatsApp } from "../lib/whatsapp";
import "../styles/Navbar.css";

const LINKS = [
  { to: "/#tortas", texto: "Tortas", ancla: true },
  { to: "/#personalizada", texto: "Personalizadas", ancla: true },
  { to: "/galeria", texto: "Galería" },
  { to: "/contacto", texto: "Contacto" },
];

function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const [conFondo, setConFondo] = useState(false);
  const { pathname } = useLocation();

  // cerrar el menú al navegar
  useEffect(() => setAbierto(false), [pathname]);

  // la barra toma fondo al bajar un poco
  useEffect(() => {
    const onScroll = () => setConFondo(window.scrollY > 12);
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
    <header className={`nav ${conFondo || abierto ? "nav--fondo" : ""}`}>
      <nav className="nav__barra contenedor" aria-label="Principal">
        <Link to="/" className="nav__logo" aria-label="Amoma, ir al inicio">
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
                <Link to={l.to}>{l.texto}</Link>
              ) : (
                <NavLink to={l.to}>{l.texto}</NavLink>
              )}
            </li>
          ))}
        </ul>

        <div className="nav__acciones">
          <a
            className="btn btn--rosa nav__cta"
            href={linkWhatsApp("¡Hola Amoma! Quería hacer un pedido.")}
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
  );
}

export default Navbar;
