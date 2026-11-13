import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { interpretarPlanilla, parsearCSV } from "../lib/importer";
import {
  importarCatalogo,
  listarCategorias,
  listarProductos,
} from "../lib/api";
import { formatearPrecio } from "../../lib/money";

const MAX_PLANILLA = 5 * 1024 * 1024;

function descargar(nombre, blob) {
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
  const [bajando, setBajando] = useState("");
  const [fase, setFase] = useState("preparando"); // preparando | importando | listo
  const [progreso, setProgreso] = useState("");
  const [final, setFinal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listarCategorias().then(setCategorias, (e) => setError(e.message));
  }, []);

  // si se toca un botón antes de que lleguen las categorías, se buscan ahí
  const conCategorias = async () => {
    if (categorias.length) return categorias;
    const lista = await listarCategorias();
    setCategorias(lista);
    return lista;
  };

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
      const [filas, cats] = await Promise.all([
        leerArchivo(f),
        conCategorias(),
      ]);
      setResultado(interpretarPlanilla(filas, cats));
    } catch (err) {
      console.error(err);
      setResultado(null);
      setError(
        "No se pudo leer el archivo. ¿Es la planilla modelo guardada como Excel o CSV?",
      );
    }
  };

  // Planilla Excel prolija: con todo lo cargado, o vacía con ejemplos.
  // (la librería se carga recién al tocar el botón)
  const bajarPlanilla = async (vacia) => {
    setError("");
    setBajando(vacia ? "vacia" : "catalogo");
    try {
      const [{ armarPlanilla }, productos, cats] = await Promise.all([
        import("../lib/planilla"),
        vacia ? [] : listarProductos(),
        conCategorias(),
      ]);
      const blob = await armarPlanilla({
        productos,
        categorias: cats,
        vacia,
      });
      descargar(
        vacia ? "amoma-planilla-vacia.xlsx" : "amoma-catalogo.xlsx",
        blob,
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo armar la planilla. Probá de nuevo.");
    } finally {
      setBajando("");
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
            code: p.code,
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
          <strong>Descargá la planilla</strong>: la de tu catálogo (trae todo lo
          cargado, una fila por tamaño) o una vacía con ejemplos.
          <div className="adm-acciones">
            <button
              type="button"
              className="btn"
              onClick={() => bajarPlanilla(false)}
              disabled={Boolean(bajando)}
            >
              {bajando === "catalogo" ? "Preparando…" : "Descargar mi catálogo"}
            </button>
            <button
              type="button"
              className="btn btn--borde"
              onClick={() => bajarPlanilla(true)}
              disabled={Boolean(bajando)}
            >
              {bajando === "vacia"
                ? "Preparando…"
                : "Planilla vacía con ejemplos"}
            </button>
          </div>
        </li>
        <li>
          <strong>Abrila en Excel</strong>, cambiá precios o agregá filas para
          productos nuevos, y guardala.
          <br />
          <small className="adm-ayuda">
            La columna gris “Código (no tocar)” queda como está (en las filas
            nuevas va vacía). Lo que borres de la planilla no se borra de la
            página. La segunda hoja, “Cómo usar”, lo explica.
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
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precios</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={p.code ?? `nuevo-${p.slug}`}>
                    <td>
                      {p.code != null ? (
                        p.code
                      ) : (
                        <span className="adm-etiqueta adm-etiqueta--rosa">
                          Nuevo
                        </span>
                      )}
                    </td>
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
