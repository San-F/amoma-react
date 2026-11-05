import { useTitulo } from "../lib/useTitulo";
import Palabras from "../components/Palabras";
import { useSitio } from "../lib/sitio";
import "../styles/Privacidad.css";

// Texto base según la Ley 25.326 de Protección de Datos Personales (Argentina).
// ⚠️ Revisar con la dueña antes de publicar (ver docs/PENDIENTES.md).
function Privacidad() {
  useTitulo(
    "Privacidad",
    "Cómo usa Amoma los datos que nos enviás: solo para responder tu pedido. Sin cookies de seguimiento.",
  );
  const { negocio } = useSitio();
  return (
    <article className="privacidad seccion contenedor">
      <p className="eyebrow">Legal</p>
      <h1 className="palabras--ya">
        <Palabras>Privacidad</Palabras>
      </h1>
      <p className="lead">
        En pocas palabras: usamos tus datos solo para responder tu pedido.
      </p>

      <h2>Qué datos usamos</h2>
      <p>
        Cuando nos escribís (por WhatsApp, Instagram o el formulario) recibimos
        lo que vos nos contás: nombre, forma de contacto y el detalle de tu
        pedido. No pedimos datos de tarjetas en esta página.
      </p>

      <h2>Para qué</h2>
      <p>
        Para responderte, cotizar y coordinar tu pedido. No los vendemos ni los
        compartimos con nadie.
      </p>

      <h2>Cookies y seguimiento</h2>
      <p>
        Esta página no usa cookies de seguimiento ni publicidad, y no carga
        servicios de terceros que te rastreen.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir ver, corregir o borrar tus datos cuando quieras
        escribiéndonos a Instagram @{negocio.instagram}. La Agencia de Acceso a
        la Información Pública (AAIP) es el órgano de control de la Ley 25.326 y
        atiende denuncias sobre el uso de datos personales.
      </p>
    </article>
  );
}

export default Privacidad;
