import { useTitulo } from "../lib/useTitulo";
import Contact from "../components/Contact";

function Contacto() {
  useTitulo(
    "Contacto",
    "Encargá tu torta en Amoma: escribinos por WhatsApp o dejá tu consulta. Villa Pueyrredón, CABA.",
  );
  return <Contact />;
}

export default Contacto;
