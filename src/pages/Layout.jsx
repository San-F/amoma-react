import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PedidoFlotante from "../components/PedidoFlotante";
import { useSitio } from "../lib/sitio";
import { irA } from "../lib/scroll";

// estructura que comparten todas las páginas
function Layout() {
  const { hash, pathname, key } = useLocation();
  const { negocio } = useSitio();

  // links con ancla (/#tortas) desde otra página: bajar a la sección
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) requestAnimationFrame(() => irA(el));
  }, [hash, pathname, key]);

  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      {negocio.aviso && (
        <p className="aviso" role="status">
          {negocio.aviso}
        </p>
      )}
      <Navbar />
      <main id="contenido">
        {/* acá se muestra la página de la ruta actual */}
        <Outlet />
      </main>
      <Footer />
      <PedidoFlotante />
      {/* vuelve arriba de todo al cambiar de página */}
      <ScrollRestoration />
    </>
  );
}

export default Layout;
