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
import Categorias from "./pages/Categorias";
import Consultas from "./pages/Consultas";
import Ajustes from "./pages/Ajustes";
import "./admin.css";

function SinConfigurar() {
  return (
    <main className="adm-auth">
      <div className="adm-auth__caja">
        <p className="adm-auth__marca">Amoma · Panel</p>
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

const MENU = [
  { to: "/admin", texto: "Resumen", end: true },
  { to: "/admin/productos", texto: "Productos" },
  { to: "/admin/importar", texto: "Excel" },
  { to: "/admin/categorias", texto: "Categorías" },
  { to: "/admin/consultas", texto: "Consultas" },
  { to: "/admin/ajustes", texto: "Ajustes" },
];

function Panel() {
  const { session, salir } = useAuth();
  return (
    <div className="adm">
      <aside className="adm__lateral">
        <p className="adm__marca">Amoma</p>
        <nav aria-label="Panel">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}>
              {m.texto}
            </NavLink>
          ))}
        </nav>
        <div className="adm__usuario">
          <span>{session.user.email}</span>
          <a href="/" target="_blank" rel="noopener noreferrer">
            Ver página ↗
          </a>
          <button type="button" className="adm-link" onClick={salir}>
            Salir
          </button>
        </div>
      </aside>
      <main className="adm__contenido">
        <Outlet />
      </main>
    </div>
  );
}

function AdminApp() {
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
          <Route path="categorias" element={<Categorias />} />
          <Route path="consultas" element={<Consultas />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default AdminApp;
