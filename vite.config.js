import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import { SITIO_URL } from "./src/data/direccion.js";
import direccion from "./scripts/vite-direccion.js";

// https://vite.dev/config/
export default defineConfig({
  // direccion: completa la dirección del sitio (src/data/direccion.js) en index.html,
  //   robots.txt, sitemap.xml y llms.txt
  // imagetools genera AVIF/WebP en varios tamaños en el build (ver src/data/images.js)
  plugins: [direccion(SITIO_URL), react(), imagetools()],
});
