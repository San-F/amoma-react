// Inicio: lo de hoy. Dos accesos grandes (precios y publicación) y las
// consultas nuevas para responder por WhatsApp.
import { Link } from "react-router-dom";
import { listarConsultas, listarProductos } from "../lib/api";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { Icono } from "../Iconos";
import { aWhatsApp } from "../../lib/telefono";

function saludo() {
  const h = new Date().getHours();
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

async function cargarInicio() {
  const [productos, consultas] = await Promise.all([
    listarProductos(),
    listarConsultas("new"),
  ]);
  return { productos, consultas };
}

function Resumen() {
  const { cargando, error, datos, recargar } = useCarga(cargarInicio);
  const productos = datos?.productos ?? [];
  const aLaVista = productos.filter((p) => p.is_published && p.portada);
  const conFoto = productos.filter((p) => p.portada);
  const fotoPrecios = conFoto[0]?.portada;
  const fotoPublicar = (conFoto[1] ?? conFoto[0])?.portada;
  const consultas = datos?.consultas ?? [];

  return (
    <>
      <h1 className="adm-hola">
        {saludo()}, <em>Amoma</em>
      </h1>
      <Estado cargando={cargando} error={error} onReintentar={recargar}>
        <p className="adm-estado">
          <span className="adm-estado__punto" aria-hidden="true" />
          {aLaVista.length === 1
            ? "1 producto a la vista en tu página"
            : `${aLaVista.length} productos a la vista en tu página`}
        </p>

        <div className="adm-inicio">
          <div className="adm-accesos">
            <Link to="/admin/productos" className="adm-acceso">
              {fotoPrecios && <img src={fotoPrecios} alt="" />}
              <b>
                Cambiar precios
                <small>
                  {productos.length === 1
                    ? "1 producto"
                    : `${productos.length} productos`}
                </small>
              </b>
            </Link>
            <Link to="/admin/publicar" className="adm-acceso">
              {fotoPublicar && <img src={fotoPublicar} alt="" />}
              <b>
                Crear publicación
                <small>Para Instagram</small>
              </b>
            </Link>
          </div>

          <section className="adm-tarjeta-blanca" aria-labelledby="t-consultas">
            <h2 id="t-consultas" className="adm-tarjeta-blanca__titulo">
              Consultas nuevas
              {consultas.length > 0 && (
                <span className="adm-etiqueta adm-etiqueta--rosa">
                  {consultas.length}
                </span>
              )}
            </h2>
            {consultas.length === 0 ? (
              <p className="adm-ayuda">
                No hay consultas nuevas. Cuando alguien escriba desde la página,
                aparece acá.
              </p>
            ) : (
              <ul className="adm-consultas-mini">
                {consultas.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <span className="adm-avatar" aria-hidden="true">
                      {c.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <b>{c.name}</b>
                      <p>{c.message || "Sin mensaje"}</p>
                    </div>
                    {c.phone && (
                      <a
                        className="adm-wa"
                        href={`https://wa.me/${aWhatsApp(c.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Responder a ${c.name} por WhatsApp`}
                      >
                        <Icono nombre="whatsapp" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/consultas" className="adm-link-fuerte">
              Ver todas las consultas
            </Link>
          </section>
        </div>
      </Estado>
    </>
  );
}

export default Resumen;
