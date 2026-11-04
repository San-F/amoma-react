import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// fuentes auto-alojadas (sin pedidos a Google Fonts): solo los pesos que se usan
import "@fontsource/pacifico/latin-400.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./index.css";
import App from "./App.jsx";

// monta App en el div#root
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
