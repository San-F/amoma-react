import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  catalogoCSV,
  interpretarPlanilla,
  parsearCSV,
  plantillaCSV,
} from "../lib/importer";
import {
  importarCatalogo,
  listarCategorias,
  listarProductos,
} from "../lib/api";
import { formatearPrecio } from "../../lib/money";

const MAX_PLANILLA = 5 * 1024 * 1024;

function descargar(nombre, contenido) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

async function leerArchivo(file) {
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    return parsearCSV(await file.text());
  }
  // .xlsx: la librería se carga solo cuando hace falta
  const { readSheet } = await import("read-excel-file/universal");
  return readSheet(file);
}

function Importar() {
  const [categorias, setCategorias] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [resultado, setResultado] = useState(null); // { productos, errores }
  const [bajando, setBajando] = useState(false);
  const [fase, setFase] = useState("preparando"); // preparando | importando | listo
  const [progreso, setProgreso] = useState("");
  const [final, setFinal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listarCategorias().then(setCategorias, (e) => setError(e.message));
  }, []);

  const elegirPlanilla = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    setFinal(null);
    setFase("preparando");
    if (f.size > MAX_PLANILLA)
      return setError("La planilla es muy grande (máx. 5 MB).");
    if (!/\.(xlsx|csv)$/i.test(f.name))
      return setError("Usá un archivo .xlsx (Excel) o .csv.");
    try {
      setArchivo(f.name);
      setResultado(interpretarPlanilla(await leerArchivo(f), categorias));
    } catch (err) {
      console.error(err);
      setResultado(null);
      setError(
        "No se pudo leer el archivo. ¿Es la planilla modelo guardada como Excel o CSV?",
      );
    }
  };

  // Baja la planilla con todo lo cargado (o el modelo, si no hay nada).
  const bajarPlanilla = async () => {
    setError("");
    setBajando(true);
    try {
      const productos = await listarProductos();
      if (productos.length)
        descargar("amoma-catalogo.csv", catalogoCSV(productos));
      else descargar("amoma-catalogo-modelo.csv", plantillaCSV());
    } catch (err) {
      setError(err.message);
    } finally {
      setBajando(false);
    }
  };

  const filas = useMemo(() => resultado?.productos ?? [], [resultado]);
  const puedeImportar =
    resultado &&
    !resultado.errores.length &&
    filas.length &&
    fase === "preparando";

  const importar = async () => {
    setFase("importando");
    setError("");
    try {
      setProgreso("Guardando el catálogo…");
      setFinal(
        await importarCatalogo(
          filas.map((p) => ({
            slug: p.slug,
            name: p.name,
            category_slug: p.category_slug,
            short_description: p.short_description,
            is_published: p.is_published,
            variants: p.variants,
          })),
        ),
      );
      setFase("listo");
    } catch (err) {
      setError(err.message);
      setFase("preparando");
    } finally {
      setProgreso("");
    }
  };

  return (
    <>
      <h1 className="adm-titulo">Cargar desde Excel</h1>

      <ol className="adm-pasos adm-pasos--grandes">
        <li>
          <strong>Descargá tu planilla</strong>: trae todo lo que tenés cargado,
          una fila por tamaño.
          <br />
          <button
            type="button"
            className="btn btn--borde"
            onClick={bajarPlanilla}
            disabled={bajando}
          >
            {bajando ? "Preparando…" : "Descargar mi catálogo"}
          </button>
        </li>
        <li>
          <strong>Abrila en Excel</strong>, cambiá precios o agregá filas para
          productos nuevos, y guardala.
          <br />
          <small className="adm-ayuda">
            La columna “codigo” no se toca (en las filas nuevas va vacía). Lo
            que borres de la planilla no se borra de la página.
          </small>
        </li>
        <li>
          <strong>Subila acá</strong> (.xlsx o .csv). Antes de guardar te
          mostramos cómo queda.
          <br />
          <label className="btn btn--borde adm-subir">
            {archivo ? `Cambiar (${archivo})` : "Elegir planilla"}
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={elegirPlanilla}
              hidden
            />
          </label>
        </li>
      </ol>
      <p className="adm-ayuda">
        Las fotos no van en la planilla: se ponen después, tocando “+ Foto” en
        cada producto.
      </p>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      {resultado && (
        <section className="adm-bloque">
          <h2>Vista previa</h2>
          {resultado.errores.length > 0 && (
            <div className="adm-error" role="alert">
              <p>
                <strong>Corregí esto en la planilla y volvé a subirla:</strong>
              </p>
              <ul>
                {resultado.errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="adm-tabla-scroll">
            <table className="adm-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precios</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={p.slug}>
                    <td>{p.name}</td>
                    <td>
                      {categorias.find((c) => c.slug === p.category_slug)
                        ?.name ?? "—"}
                    </td>
                    <td>
                      {p.variants.map((v) => (
                        <div key={v.label}>
                          {v.label}: {formatearPrecio(v.price_cents)}
                        </div>
                      ))}
                    </td>
                    <td>
                      {p.is_published == null
                        ? "Como está"
                        : p.is_published
                          ? "Sí"
                          : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="adm-ayuda">
            Los productos que ya existen se actualizan y sus precios se
            reemplazan por los de la planilla; los nuevos se agregan al final.
            Si algo falla, no se guarda nada.
          </p>
          <button
            type="button"
            className="btn btn--rosa"
            disabled={!puedeImportar}
            onClick={importar}
          >
            {fase === "importando"
              ? progreso || "Importando…"
              : `Importar ${filas.length} producto(s)`}
          </button>
        </section>
      )}

      {final && (
        <div className="adm-ok" role="status">
          <p>
            ¡Listo! {final.creados} nuevo(s), {final.actualizados}{" "}
            actualizado(s), {final.variantes} precio(s).
          </p>
          {final.creados > 0 && (
            <p>
              A los productos nuevos les falta la foto para verse en la página.
            </p>
          )}
          <Link to="/admin/productos">
            {final.creados > 0 ? "Ponerles foto →" : "Ver productos →"}
          </Link>
        </div>
      )}
    </>
  );
}

export default Importar;
