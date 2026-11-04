import { useState } from "react";
import Icon from "./Icon";
import "../styles/Contact.css";

const FORMULARIO_VACIO = {
  nombre: "",
  email: "",
  telefono: "",
  comentarios: "",
  motivo: "torta",
  preferencia: "WhatsApp",
};

function Contact() {
  // un solo objeto de estado para todos los campos
  const [form, setForm] = useState(FORMULARIO_VACIO);
  // datos del último envío, para el mensaje de gracias
  const [enviado, setEnviado] = useState(null);

  // nombre y email obligatorios para habilitar el envío
  const formularioCompleto =
    form.nombre.trim() !== "" && form.email.trim() !== "";

  // el name de cada input coincide con su clave en el estado
  const manejarCambios = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const enviarFormulario = (e) => {
    // evita que la página se recargue
    e.preventDefault();
    setEnviado(form);
    setForm(FORMULARIO_VACIO);
  };

  const limpiarFormulario = () => {
    setForm(FORMULARIO_VACIO);
    setEnviado(null);
  };

  return (
    <section>
      <h2>Contacto</h2>

      <div className="contacto-datos">
        <p>
          <Icon name="phone" /> Teléfono: 11 3636 2466
        </p>
        <p>
          <Icon name="instagram" /> Instagram: @amoma.cakeshop
        </p>
        <p>
          <Icon name="location" /> Villa Pueyrredón, CABA
        </p>
      </div>

      {enviado && (
        <p className="mensaje-gracias">
          ¡Gracias, {enviado.nombre}! Te vamos a escribir por{" "}
          {enviado.preferencia} muy pronto 🍰
        </p>
      )}

      <form onSubmit={enviarFormulario}>
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={form.nombre}
          onChange={manejarCambios}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={manejarCambios}
          required
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          value={form.telefono}
          onChange={manejarCambios}
        />

        <label htmlFor="comentarios">Comentarios</label>
        <textarea
          id="comentarios"
          name="comentarios"
          value={form.comentarios}
          onChange={manejarCambios}
        ></textarea>

        <label htmlFor="motivo">Motivo de contacto</label>
        <select
          id="motivo"
          name="motivo"
          value={form.motivo}
          onChange={manejarCambios}
        >
          <option value="torta">Encargar una torta</option>
          <option value="evento">Pedido para evento</option>
          <option value="consulta">Consulta general</option>
        </select>

        <fieldset>
          <legend>¿Cómo preferís que te contactemos?</legend>
          <input
            type="radio"
            id="pref-wpp"
            name="preferencia"
            value="WhatsApp"
            checked={form.preferencia === "WhatsApp"}
            onChange={manejarCambios}
          />
          <label htmlFor="pref-wpp">WhatsApp</label>
          <input
            type="radio"
            id="pref-ig"
            name="preferencia"
            value="Instagram"
            checked={form.preferencia === "Instagram"}
            onChange={manejarCambios}
          />
          <label htmlFor="pref-ig">Instagram</label>
        </fieldset>

        <button type="submit" disabled={!formularioCompleto}>
          {formularioCompleto ? "Enviar" : "Completá nombre y email"}
        </button>
        <button
          type="button"
          className="boton-limpiar"
          onClick={limpiarFormulario}
        >
          Limpiar
        </button>
      </form>
    </section>
  );
}

export default Contact;
