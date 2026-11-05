import Reveal from "../components/Reveal";
import Palabras from "../components/Palabras";
import Icon from "../components/Icon";

import { linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import "../styles/Closing.css";

const pasos = (zona) => [
  {
    titulo: "Elegí",
    texto: "Una torta del catálogo o contanos tu idea para una personalizada.",
  },
  {
    titulo: "Escribinos",
    texto: "Por WhatsApp te pasamos el precio y las fechas disponibles.",
  },
  {
    titulo: "Coordinamos",
    texto: `Confirmás y acordamos el retiro en ${zona.split(",")[0]} o el envío.`,
  },
];

function Closing() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  return (
    <section className="cierre" aria-labelledby="cierre-titulo">
      <div className="contenedor">
        <Reveal className="cierre__cabecera">
          <p className="eyebrow">Cómo pedir</p>
          <h2 id="cierre-titulo">
            <Palabras>
              Simple, como <em>tiene que ser</em>
            </Palabras>
          </h2>
        </Reveal>

        <ol className="cierre__pasos">
          {pasos(negocio.zona).map((p, i) => (
            <Reveal as="li" key={p.titulo} delay={i * 120}>
              <span className="cierre__num">0{i + 1}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="cierre__ctas">
          <a
            className="btn btn--rosa"
            href={wa("¡Hola Amoma! Quería hacer un pedido.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" /> Escribinos por WhatsApp
          </a>
          <a
            className="btn btn--claro"
            href={`https://www.instagram.com/${negocio.instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="instagram" /> @{negocio.instagram}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export default Closing;
