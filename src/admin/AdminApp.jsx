// Panel de administración. Se carga aparte (lazy): el público nunca
// descarga este código.
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { supabaseConfigurado } from "../lib/supabase";
import { AuthProvider, useAuth } from "./auth";
import Login from "./pages/Login";
import Acceso from "./pages/Acceso";
import Seguridad from "./pages/Seguridad";
import Resumen from "./pages/Resumen";
import Productos from "./pages/Productos";
import ProductoEditar from "./pages/ProductoEditar";
import Importar from "./pages/Importar";
import Galeria from "./pages/Galeria";
import Consultas from "./pages/Consultas";
import Ajustes from "./pages/Ajustes";
import Publicar from "./pages/Publicar";
import { Icono } from "./Iconos";
import "./admin.css";
// cursiva real de la letra de títulos (también la usan las publicaciones)
import "@fontsource-variable/fraunces/soft-italic.css";
import { useEffect } from "react";

function SinConfigurar() {
  return (
    <main className="adm-auth">
      <div className="adm-auth__caja">
        <img className="adm-auth__logo" src="/logo.png" alt="Amoma" />
        <h1>Falta conectar la base de datos</h1>
        <p>
          Configurá <code>VITE_SUPABASE_URL</code> y{" "}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      </div>
    </main>
  );
}

// Decide qué pantalla mostrar. NO es la seguridad: la base rechaza todo
// lo que no venga de un admin con doble factor.
function Protegido() {
  const { session, estado, cargando } = useAuth();
  const location = useLocation();
  if (cargando || (session && !estado))
    return <p className="adm-cargando">Cargando…</p>;
  if (!session)
    return (
      <Navigate
        to="/admin/ingresar"
        state={{ desde: location.pathname }}
        replace
      />
    );
  if (!estado.is_member || !estado.has_mfa)
    return <Navigate to="/admin/seguridad" replace />;
  return <Panel />;
}

// 4 secciones, cada una con un propósito. Lo que se toca una vez al año
// (datos del negocio, salir) va al engranaje.
const MENU = [
  { to: "/admin", texto: "Inicio", icono: "inicio", end: true },
  { to: "/admin/productos", texto: "Productos", icono: "productos" },
  { to: "/admin/galeria", texto: "Fotos", icono: "fotos" },
  { to: "/admin/publicar", texto: "Publicar", icono: "publicar" },
];

function Panel() {
  return (
    <div className="adm">
      <nav className="adm__menu" aria-label="Panel">
        <img className="adm__logo" src="/logo.png" alt="Amoma" />
        {MENU.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>
            <Icono nombre={m.icono} />
            <span>{m.texto}</span>
          </NavLink>
        ))}
      </nav>
      <div className="adm__cuerpo">
        <header className="adm__cabecera">
          <img className="adm__logo-cel" src="/logo.png" alt="Amoma" />
          <NavLink
            to="/admin/ajustes"
            className="adm__engranaje"
            aria-label="Ajustes y cuenta"
            title="Ajustes y cuenta"
          >
            <Icono nombre="ajustes" />
          </NavLink>
        </header>
        <main className="adm__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminApp() {
  // nombre propio en la pestaña y en favoritos (no confundir con la página)
  useEffect(() => {
    const antes = document.title;
    document.title = "Panel Amoma";
    return () => {
      document.title = antes;
    };
  }, []);
  if (!supabaseConfigurado) return <SinConfigurar />;
  return (
    <AuthProvider>
      <Routes>
        <Route path="ingresar" element={<Login />} />
        <Route path="acceso" element={<Acceso />} />
        <Route path="seguridad" element={<Seguridad />} />
        <Route element={<Protegido />}>
          <Route index element={<Resumen />} />
          <Route path="productos" element={<Productos />} />
          <Route path="productos/:id" element={<ProductoEditar />} />
          <Route path="importar" element={<Importar />} />
          <Route path="galeria" element={<Galeria />} />
          <Route path="consultas" element={<Consultas />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="publicar" element={<Publicar />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default AdminApp;
