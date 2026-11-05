import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// fuentes auto-alojadas (sin pedidos a Google Fonts)
import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/manrope";
import "./index.css";
import App from "./App.jsx";

// monta App en el div#root
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// la página ya está dibujada: la bienvenida puede abrirse como telón
requestAnimationFrame(() => window.__cerrarBienvenida?.());
