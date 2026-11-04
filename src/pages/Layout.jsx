import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// estructura que comparten todas las páginas
function Layout() {
  const { hash, pathname, key } = useLocation();

  // links con ancla (/#tortas) desde otra página: bajar a la sección
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, pathname, key]);

  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        {/* acá se muestra la página de la ruta actual */}
        <Outlet />
      </main>
      <Footer />
      {/* vuelve arriba de todo al cambiar de página */}
      <ScrollRestoration />
    </>
  );
}

export default Layout;
