// Fotos reales de Amoma, optimizadas en el build (AVIF + WebP + JPEG, varios anchos).
// Cuando el catálogo venga de Supabase (Etapa 3), las fotos nuevas las sube la dueña.
// Fotos de portada y categorías (las originales de la página)
import hero from "../assets/img/hero.jpg?w=400;736&format=avif;webp;jpg&as=picture";
import card2 from "../assets/img/card-2.jpg?w=400;717&format=avif;webp;jpg&as=picture";
import cardSalado from "../assets/img/card-salado.jpg?w=400;768&format=avif;webp;jpg&as=picture";
import card3 from "../assets/img/card-3.jpg?w=400;800;1068&format=avif;webp;jpg&as=picture";
// Trabajos reales de Amoma
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

export const portada = {
  tortas: {
    picture: hero,
    alt: "Porción de torta de chocolate húmeda con un tenedor",
  },
  postres: {
    picture: card2,
    alt: "Porciones de torta con crema y frutos rojos",
  },
  personalizadas: { picture: card3, alt: "Torta armada capa por capa" },
  salado: {
    picture: cardSalado,
    alt: "Chipá recién horneado, abierto, con queso que se estira",
  },
};

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
