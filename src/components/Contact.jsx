import { useId, useState } from "react";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { negocio } from "../data/catalog";
import { linkWhatsApp } from "../lib/whatsapp";
import "../styles/Contact.css";

const MOTIVOS = {
  torta: "Encargar una torta",
  evento: "Pedido para evento",
  consulta: "Consulta general",
};

const VACIO = { nombre: "", motivo: "torta", mensaje: "" };

// Mientras no exista el envío por servidor (Etapa 3), el formulario arma
// el mensaje y abre WhatsApp: el pedido llega SÍ o SÍ, nunca se pierde.
function Contact() {
  const uid = useId();
  const [form, setForm] = useState(VACIO);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const completo = form.nombre.trim() !== "";

  const mensaje = [
    `¡Hola Amoma! Soy ${form.nombre.trim()}.`,
    `Motivo: ${MOTIVOS[form.motivo]}.`,
    form.mensaje.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const enviar = (e) => {
    e.preventDefault();
    if (!completo) return;
    window.open(linkWhatsApp(mensaje), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="contacto seccion">
      <div className="contacto__grid contenedor">
        <Reveal>
          <p className="eyebrow">Contacto</p>
          <h1>
            Hablemos de <em>tu torta</em>
          </h1>
          <p className="lead">
            Contanos qué necesitás y te respondemos por WhatsApp con precio y
            disponibilidad.
          </p>

          <ul className="contacto__datos">
            <li>
              <Icon name="phone" />
              <a href={`tel:+${negocio.whatsapp}`}>{negocio.telefonoVisible}</a>
            </li>
            <li>
              <Icon name="instagram" />
              <a
                href={`https://www.instagram.com/${negocio.instagram}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{negocio.instagram}
              </a>
            </li>
            <li>
              <Icon name="location" />
              {negocio.zona}
            </li>
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <form className="contacto__form" onSubmit={enviar}>
            <div className="campo">
              <label htmlFor={`${uid}-nombre`}>Tu nombre</label>
              <input
                id={`${uid}-nombre`}
                name="nombre"
                autoComplete="given-name"
                maxLength={100}
                value={form.nombre}
                onChange={cambiar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor={`${uid}-motivo`}>Motivo</label>
              <select
                id={`${uid}-motivo`}
                name="motivo"
                value={form.motivo}
                onChange={cambiar}
              >
                {Object.entries(MOTIVOS).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor={`${uid}-mensaje`}>
                Contanos más <small>(fecha, cantidad de personas, idea…)</small>
              </label>
              <textarea
                id={`${uid}-mensaje`}
                name="mensaje"
                rows="4"
                maxLength={1000}
                value={form.mensaje}
                onChange={cambiar}
              />
            </div>

            <button
              type="submit"
              className="btn btn--rosa"
              disabled={!completo}
            >
              <Icon name="whatsapp" /> Enviar por WhatsApp
            </button>
            <p className="contacto__nota">
              Se abre WhatsApp con tu mensaje listo para enviar.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default Contact;
