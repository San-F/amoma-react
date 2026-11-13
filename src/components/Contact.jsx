import { useId, useState } from "react";
import Palabras from "./Palabras";
import Icon from "./Icon";
import Reveal from "./Reveal";
import { linkWhatsApp } from "../lib/whatsapp";
import { useSitio } from "../lib/sitio";
import { enviarConsulta, guardaConsultas } from "../lib/consultas";
import "../styles/Contact.css";

const MOTIVOS = {
  torta: "Encargar una torta",
  evento: "Pedido para evento",
  consulta: "Consulta general",
};

const PREFERENCIAS = ["WhatsApp", "Instagram", "Email"];

const VACIO = {
  nombre: "",
  email: "",
  telefono: "",
  motivo: "torta",
  mensaje: "",
  preferencia: "WhatsApp",
  website: "", // campo trampa para robots (invisible para personas)
};

// Si la base está conectada, la consulta queda guardada en el panel.
// Si no, o si algo falla, se ofrece WhatsApp: el pedido nunca se pierde.
function Contact() {
  const { negocio } = useSitio();
  const wa = (mensaje) => linkWhatsApp(mensaje, negocio.whatsapp);
  const uid = useId();
  const [form, setForm] = useState(VACIO);
  const [estado, setEstado] = useState("editando"); // editando | enviando | enviado | error
  const [error, setError] = useState("");

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const tieneContacto = guardaConsultas
    ? form.email.trim() !== "" || form.telefono.trim() !== ""
    : true;
  const completo = form.nombre.trim() !== "" && tieneContacto;

  const mensaje = [
    `¡Hola Amoma! Soy ${form.nombre.trim()}.`,
    `Motivo: ${MOTIVOS[form.motivo]}.`,
    form.mensaje.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const enviar = async (e) => {
    e.preventDefault();
    if (!completo) return;
    if (!guardaConsultas) {
      window.open(wa(mensaje), "_blank", "noopener,noreferrer");
      return;
    }
    setEstado("enviando");
    setError("");
    try {
      await enviarConsulta(form);
      setEstado("enviado");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  };

  return (
    <section className="contacto seccion">
      <div className="contacto__grid contenedor">
        <Reveal>
          <p className="eyebrow">Contacto</p>
          <h1>
            <Palabras>
              Hablemos de <em>tu torta</em>
            </Palabras>
          </h1>
          <p className="lead">
            Contanos qué necesitás y te respondemos con precio y disponibilidad.
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
          {negocio.horarios && (
            <p className="contacto__horarios">{negocio.horarios}</p>
          )}
        </Reveal>

        <Reveal delay={120}>
          {estado === "enviado" ? (
            <div className="contacto__form contacto__gracias" role="status">
              <p className="contacto__gracias-titulo">
                ¡Gracias, {form.nombre.trim()}! 🎂
              </p>
              <p>
                Recibimos tu consulta. Te escribimos por {form.preferencia} muy
                pronto.
              </p>
              <p>¿Apuro? Mandanos lo mismo por WhatsApp y lo vemos antes.</p>
              <a
                className="btn btn--rosa"
                href={wa(mensaje)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" /> Enviar por WhatsApp
              </a>
              <button
                type="button"
                className="btn btn--borde"
                onClick={() => {
                  setForm(VACIO);
                  setEstado("editando");
                }}
              >
                Enviar otra
              </button>
            </div>
          ) : (
            <form
              className="contacto__form"
              onSubmit={enviar}
              noValidate={false}
            >
              <div className="campo">
                <label htmlFor={`${uid}-nombre`}>Tu nombre</label>
                <input
                  id={`${uid}-nombre`}
                  name="nombre"
                  autoComplete="name"
                  maxLength={100}
                  value={form.nombre}
                  onChange={cambiar}
                  required
                />
              </div>

              {guardaConsultas && (
                <div className="contacto__fila">
                  <div className="campo">
                    <label htmlFor={`${uid}-tel`}>WhatsApp / teléfono</label>
                    <input
                      id={`${uid}-tel`}
                      name="telefono"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={form.telefono}
                      onChange={cambiar}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor={`${uid}-email`}>Email</label>
                    <input
                      id={`${uid}-email`}
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={form.email}
                      onChange={cambiar}
                    />
                  </div>
                </div>
              )}

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
                  Contanos más{" "}
                  <small>(fecha, cantidad de personas, idea…)</small>
                </label>
                <textarea
                  id={`${uid}-mensaje`}
                  name="mensaje"
                  rows="4"
                  maxLength={2000}
                  value={form.mensaje}
                  onChange={cambiar}
                />
              </div>

              {guardaConsultas && (
                <fieldset className="contacto__pref">
                  <legend>¿Por dónde te respondemos?</legend>
                  {PREFERENCIAS.map((p) => (
                    <label key={p} className="tamano">
                      <input
                        type="radio"
                        name="preferencia"
                        value={p}
                        checked={form.preferencia === p}
                        onChange={cambiar}
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              {/* trampa: invisible para personas; los robots la completan */}
              <div className="contacto__trampa" aria-hidden="true">
                <label htmlFor={`${uid}-web`}>No completar</label>
                <input
                  id={`${uid}-web`}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={cambiar}
                />
              </div>

              {estado === "error" && (
                <div className="contacto__error" role="alert">
                  <p>{error}</p>
                  <a
                    className="btn btn--borde"
                    href={wa(mensaje)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="whatsapp" /> Mandalo por WhatsApp
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="btn btn--rosa"
                disabled={!completo || estado === "enviando"}
              >
                {guardaConsultas ? (
                  estado === "enviando" ? (
                    "Enviando…"
                  ) : (
                    "Enviar consulta"
                  )
                ) : (
                  <>
                    <Icon name="whatsapp" /> Enviar por WhatsApp
                  </>
                )}
              </button>
              <p className="contacto__nota">
                {guardaConsultas ? (
                  <>
                    Dejanos un WhatsApp o un email para responderte. ¿Apurado?{" "}
                    <a
                      href={wa(mensaje)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Escribinos directo por WhatsApp
                    </a>
                    .
                  </>
                ) : (
                  "Se abre WhatsApp con tu mensaje listo para enviar."
                )}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default Contact;
