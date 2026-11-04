import Hero from "../sections/Hero";
import CakeBuilder from "../sections/CakeBuilder";
import Featured from "../sections/Featured";
import GalleryStrip from "../sections/GalleryStrip";
import Closing from "../sections/Closing";

// 5 secciones, cada una con un propósito (ver docs/DESIGN.md)
function Inicio() {
  return (
    <>
      <Hero />
      <CakeBuilder />
      <Featured />
      <GalleryStrip />
      <Closing />
    </>
  );
}

export default Inicio;
