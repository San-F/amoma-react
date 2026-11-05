import { useTitulo } from "../lib/useTitulo";
import Contact from "../components/Contact";

function Contacto() {
  useTitulo(
    "Contacto",
    "Encargá tu torta en Amoma: escribinos por WhatsApp o dejá tu consulta. CABA.",
  );
  return <Contact />;
}

export default Contacto;
