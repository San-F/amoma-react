import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";

// https://vite.dev/config/
export default defineConfig({
  // imagetools genera AVIF/WebP en varios tamaños en el build (ver src/data/images.js)
  plugins: [react(), imagetools()],
});
