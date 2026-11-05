import { useEffect, useId, useRef, useState } from "react";
import Palabras from "../components/Palabras";
import { Link } from "react-router-dom";
import CakeIllustration from "./CakeIllustration";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { opcionesTorta } from "../data/catalog";
import { fechaLegible, fechaMinima, linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import "../styles/CustomCake.css";

const op = (grupo, id) =>
  opcionesTorta[grupo].opciones.find((o) => o.id === id);

// Combinaciones que la animación va armando sola, una tras otra
const COMBINACIONES = [
  [
    op("bizcochuelo", "chocolate"),
    op("relleno", "ddl"),
    op("cobertura", "rosa"),
    op("decoracion", "frutos-rojos"),
  ],
  [
    op("bizcochuelo", "vainilla"),
    op("relleno", "crema-frutillas"),
    op("cobertura", "chantilly"),
    op("decoracion", "flores"),
  ],
  [
    op("bizcochuelo", "red-velvet"),
    op("relleno", "ddl"),
    op("cobertura", "ganache"),
    op("decoracion", "rosetas"),
  ],
];
const CAPAS = ["bizcochuelo", "relleno", "cobertura", "decoracion"];
// cuánto dura cada momento (ms):
// vacío, +bizcochuelo, +relleno, +cobertura, +decoración (se luce), sale
const TIEMPOS = [600, 1500, 1100, 1700, 3400, 650];
const SALE = 5;

function CustomCake() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  const uid = useId();
  const escenaRef = useRef(null);
  const [combo, setCombo] = useState(0);
  const [paso, setPaso] = useState(4); // arranca completa (y así queda si no hay animación)
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ nombre: "", idea: "", fecha: "" });

  // solo anima cuando está en pantalla (ahorra batería) y si el usuario no pidió menos movimiento
  useEffect(() => {
    const el = escenaRef.current;
    const menosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!el || menosMovimiento || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      if (paso < SALE) setPaso(paso + 1);
      else {
        setCombo((c) => (c + 1) % COMBINACIONES.length);
        setPaso(0);
      }
    }, TIEMPOS[paso]);
    return () => clearTimeout(t);
  }, [visible, paso]);

  const capas = COMBINACIONES[combo];
  const eleccion = Object.fromEntries(
    CAPAS.map((c, i) => [c, i < paso ? capas[i] : null]),
  );
  const hechas = capas.slice(0, Math.min(paso, CAPAS.length));

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const completo = form.idea.trim() !== "";
  const mensaje = [
    `¡Hola Amoma!${form.nombre.trim() ? ` Soy ${form.nombre.trim()}.` : ""} Quiero una torta personalizada:`,
    form.idea.trim(),
    form.fecha ? `Para el ${fechaLegible(form.fecha)}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const enviar = (e) => {
    e.preventDefault();
    if (completo) window.open(wa(mensaje), "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="personalizada"
      className="personalizada seccion"
      aria-labelledby={`${uid}-t`}
    >
      <div className="personalizada__grid contenedor">
        <div className="personalizada__escena" ref={escenaRef}>
          <CakeIllustration
            eleccion={eleccion}
            saliendo={paso === SALE}
            descripcion="Animación: una torta que se arma capa por capa"
          />
          <ul
            className={`capas-chips ${paso === SALE ? "capas-chips--sale" : ""}`}
            aria-hidden="true"
            key={combo}
          >
            {hechas.map((c, i) => (
              <li key={`${i}-${c.id}`}>
                <span style={{ "--c": c.color ?? "var(--rosa)" }} />
                {c.nombre}
              </li>
            ))}
          </ul>
        </div>

        <Reveal className="personalizada__cabecera">
          <p className="eyebrow">Tortas personalizadas</p>
          <h2 id={`${uid}-t`}>
            <Palabras>
              Tu torta, <em>a tu manera</em>
            </Palabras>
          </h2>
          <p className="lead">
            Sabores, colores, temática, cantidad de personas. Contanos tu idea y
            la diseñamos con vos.
          </p>
        </Reveal>

        <Reveal className="personalizada__formbox">
          <form className="personalizada__form" onSubmit={enviar}>
            <div className="campo">
              <label htmlFor={`${uid}-idea`}>Tu idea</label>
              <textarea
                id={`${uid}-idea`}
                name="idea"
                rows="3"
                maxLength={800}
                placeholder="Ej.: torta de 2 pisos para 30 personas, temática arcoíris, chocolate y dulce de leche"
                value={form.idea}
                onChange={cambiar}
                required
              />
            </div>
            <div className="personalizada__fila">
              <div className="campo">
                <label htmlFor={`${uid}-nombre`}>Tu nombre</label>
                <input
                  id={`${uid}-nombre`}
                  name="nombre"
                  autoComplete="given-name"
                  maxLength={80}
                  value={form.nombre}
                  onChange={cambiar}
                />
              </div>
              <div className="campo">
                <label htmlFor={`${uid}-fecha`}>¿Para cuándo?</label>
                <input
                  id={`${uid}-fecha`}
                  name="fecha"
                  type="date"
                  min={fechaMinima(3)}
                  value={form.fecha}
                  onChange={cambiar}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn--rosa"
              disabled={!completo}
            >
              <Icon name="whatsapp" /> Enviar idea por WhatsApp
            </button>
          </form>
          <Link to="/galeria" className="personalizada__galeria" viewTransition>
            Ver tortas personalizadas que ya hicimos <Icon name="arrow" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export default CustomCake;
