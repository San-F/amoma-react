import Hero from "../sections/Hero";
import Ribbon from "../sections/Ribbon";
import Categories from "../sections/Categories";
import Catalog from "../sections/Catalog";
import CustomCake from "../sections/CustomCake";
import Closing from "../sections/Closing";

// Recorrido pensado para quien llega desde Instagram con el celular:
// impacto → qué hacen → elegir una torta → o pedir una a medida → cómo pedir
function Inicio() {
  return (
    <>
      <Hero />
      <Ribbon />
      <Categories />
      <Catalog />
      <CustomCake />
      <Closing />
    </>
  );
}

export default Inicio;
