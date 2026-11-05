import { useTitulo } from "../lib/useTitulo";
import Gallery from "../components/Gallery";

function Galeria() {
  useTitulo(
    "Galería",
    "Galería de tortas y postres hechos por Amoma: tortas temáticas, personalizadas y clásicas caseras.",
  );
  return <Gallery />;
}

export default Galeria;
