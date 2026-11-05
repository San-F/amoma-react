import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./pages/Layout";
import Inicio from "./pages/Inicio";
import Galeria from "./pages/Galeria";
import Contacto from "./pages/Contacto";
import Privacidad from "./pages/Privacidad";
import Error404 from "./pages/Error404";
import ErrorPagina from "./pages/ErrorPagina";

const rutas = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPagina />,
    children: [
      { index: true, element: <Inicio /> },
      { path: "galeria", element: <Galeria /> },
      { path: "contacto", element: <Contacto /> },
      { path: "privacidad", element: <Privacidad /> },
      { path: "*", element: <Error404 /> },
    ],
  },
  {
    // panel de admin: se descarga aparte, solo si alguien entra a /admin
    path: "/admin/*",
    errorElement: <ErrorPagina />,
    lazy: async () => ({
      Component: (await import("./admin/AdminApp")).default,
    }),
  },
]);

function App() {
  return <RouterProvider router={rutas} />;
}

export default App;
