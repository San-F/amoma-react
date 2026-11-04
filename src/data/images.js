// Fotos reales de Amoma, optimizadas en el build (AVIF + WebP + JPEG, varios anchos).
// Cuando el catálogo venga de Supabase (Etapa 3), las fotos nuevas las sube la dueña.
import torta1 from "../assets/img/torta-1.jpeg?w=480;800;1200&format=avif;webp;jpg&as=picture";
import torta2 from "../assets/img/torta-2.jpeg?w=480;800;1008&format=avif;webp;jpg&as=picture";
import torta3 from "../assets/img/torta-3.jpeg?w=480;800;912&format=avif;webp;jpg&as=picture";
import torta4 from "../assets/img/torta-4.jpeg?w=480;800;896&format=avif;webp;jpg&as=picture";
import torta5 from "../assets/img/torta-5.jpeg?w=480;768&format=avif;webp;jpg&as=picture";
import torta6 from "../assets/img/torta-6.jpeg?w=480;800;976&format=avif;webp;jpg&as=picture";
import torta7 from "../assets/img/torta-7.jpeg?w=480;800;896&format=avif;webp;jpg&as=picture";
import torta8 from "../assets/img/torta-8.jpeg?w=480;800;896&format=avif;webp;jpg&as=picture";
import torta9 from "../assets/img/torta-9.jpeg?w=480;800;1024&format=avif;webp;jpg&as=picture";
import torta10 from "../assets/img/torta-10.jpeg?w=480;800;1024&format=avif;webp;jpg&as=picture";

export const fotos = {
  chocolateRosetas: {
    picture: torta1,
    alt: "Torta de chocolate con rosetas de crema",
  },
  dulceDeLecheCrumble: {
    picture: torta2,
    alt: "Tarta de dulce de leche con crumble",
  },
  frutosRojos: { picture: torta3, alt: "Dos tortas con crema y frutos rojos" },
  charlotte: { picture: torta4, alt: "Charlotte de vainillas con moño azul" },
  arandanos: { picture: torta5, alt: "Torta con crema y arándanos" },
  arcoiris: { picture: torta6, alt: "Torta arcoíris con flores" },
  surf: { picture: torta7, alt: "Torta temática de surf" },
  calabaza: { picture: torta8, alt: "Torta calabaza de Halloween" },
  tartitasHalloween: { picture: torta9, alt: "Caja de tartitas de Halloween" },
  lemonPie: { picture: torta10, alt: "Lemon pie con merengue" },
};
