import { Link } from "react-router-dom";
import "../styles/Error404.css";

// se muestra con cualquier dirección que no exista (ruta "*")
function Error404() {
  return (
    <section className="error-404 seccion contenedor">
      <p className="error-404__numero" aria-hidden="true">
        404
      </p>
      <h1>
        Esta torta <em>no está en el menú</em>
      </h1>
      <p className="lead">La página que buscás no existe o cambió de lugar.</p>
      <Link to="/" className="btn">
        Volver al inicio
      </Link>
    </section>
  );
}

export default Error404;
