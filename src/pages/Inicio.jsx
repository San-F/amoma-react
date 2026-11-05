import Seguro from "../components/Seguro";
import { useTitulo } from "../lib/useTitulo";
import Hero from "../sections/Hero";
import Ribbon from "../sections/Ribbon";
import Categories from "../sections/Categories";
import Catalog from "../sections/Catalog";
import CustomCake from "../sections/CustomCake";
import Closing from "../sections/Closing";

// Recorrido pensado para quien llega desde Instagram con el celular:
// impacto → qué hacen → elegir una torta → o pedir una a medida → cómo pedir
function Inicio() {
  useTitulo();
  return (
    <>
      <Seguro>
        <Hero />
      </Seguro>
      <Seguro>
        <Ribbon />
      </Seguro>
      <Seguro>
        <Categories />
      </Seguro>
      <Seguro>
        <Catalog />
      </Seguro>
      <Seguro>
        <CustomCake />
      </Seguro>
      <Seguro>
        <Closing />
      </Seguro>
    </>
  );
}

export default Inicio;
