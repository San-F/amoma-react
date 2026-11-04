import { Link } from "react-router-dom";
import { resumen } from "../lib/api";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";

function Resumen() {
  const { cargando, error, datos, recargar } = useCarga(resumen);
  return (
    <>
      <h1 className="adm-titulo">Hola 👋</h1>
      <Estado cargando={cargando} error={error} onReintentar={recargar}>
        {datos && (
          <div className="adm-tarjetas">
            <Link to="/admin/productos" className="adm-tarjeta">
              <strong>{datos.publicados}</strong> productos publicados
            </Link>
            <Link to="/admin/productos" className="adm-tarjeta">
              <strong>{datos.ocultos}</strong> ocultos
            </Link>
            <Link to="/admin/consultas" className="adm-tarjeta">
              <strong>{datos.consultasNuevas}</strong> consultas nuevas
            </Link>
          </div>
        )}
      </Estado>
      <div className="adm-acciones">
        <Link className="btn" to="/admin/productos/nuevo">
          + Nuevo producto
        </Link>
        <Link className="btn btn--borde" to="/admin/importar">
          Cargar desde Excel
        </Link>
      </div>
    </>
  );
}

export default Resumen;
