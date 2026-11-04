import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  claveFoto,
  interpretarPlanilla,
  parsearCSV,
  plantillaCSV,
} from "../lib/importer";
import {
  borrarArchivos,
  importarCatalogo,
  listarCategorias,
  subirFoto,
} from "../lib/api";
import { validarImagen } from "../lib/images";
import { formatearPrecio } from "../../lib/money";

const MAX_PLANILLA = 5 * 1024 * 1024;

function descargarModelo() {
  const blob = new Blob([plantillaCSV()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "amoma-catalogo-modelo.csv";
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
  const [fotos, setFotos] = useState(new Map()); // clave → File
  const [errorFotos, setErrorFotos] = useState("");
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

  const elegirFotos = (e) => {
    const nuevas = new Map(fotos);
    setErrorFotos("");
    for (const f of e.target.files) {
      const problema = validarImagen(f);
      if (problema) setErrorFotos(problema);
      else nuevas.set(claveFoto(f.name), f);
    }
    e.target.value = "";
    setFotos(nuevas);
  };

  const filas = useMemo(
    () =>
      (resultado?.productos ?? []).map((p) => ({
        ...p,
        archivoFoto: p.foto ? fotos.get(claveFoto(p.foto)) : null,
      })),
    [resultado, fotos],
  );
  const fotosFaltantes = filas.filter((p) => p.foto && !p.archivoFoto);
  const puedeImportar =
    resultado &&
    !resultado.errores.length &&
    filas.length &&
    fase === "preparando";

  const importar = async () => {
    setFase("importando");
    setError("");
    const subidas = [];
    try {
      const payload = [];
      for (const [i, p] of filas.entries()) {
        let cover_path = null;
        if (p.archivoFoto) {
          setProgreso(`Subiendo fotos… ${i + 1} de ${filas.length}`);
          cover_path = (await subirFoto(p.archivoFoto, `productos/${p.slug}`))
            .path;
          subidas.push(cover_path);
        }
        payload.push({
          slug: p.slug,
          name: p.name,
          category_slug: p.category_slug,
          short_description: p.short_description,
          is_published: p.is_published,
          cover_path,
          variants: p.variants,
        });
      }
      setProgreso("Guardando el catálogo…");
      setFinal(await importarCatalogo(payload));
      setFase("listo");
    } catch (err) {
      // si falló, no dejamos fotos huérfanas
      await borrarArchivos(subidas).catch(() => {});
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
          <strong>Descargá la planilla modelo</strong> y completala en Excel
          (una fila por tamaño).
          <br />
          <button
            type="button"
            className="btn btn--borde"
            onClick={descargarModelo}
          >
            Descargar planilla modelo
          </button>
        </li>
        <li>
          <strong>Subí la planilla</strong> (.xlsx o .csv).
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
        <li>
          <strong>Subí las fotos</strong> con el mismo nombre que pusiste en la
          columna “foto”. Podés elegir todas juntas.
          <br />
          <label className="btn btn--borde adm-subir">
            Elegir fotos {fotos.size > 0 && `(${fotos.size})`}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={elegirFotos}
              hidden
            />
          </label>
          {errorFotos && <p className="adm-error">{errorFotos}</p>}
        </li>
      </ol>

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
          {fotosFaltantes.length > 0 && (
            <p className="adm-aviso">
              Faltan {fotosFaltantes.length} foto(s):{" "}
              {fotosFaltantes.map((p) => p.foto).join(", ")}. Podés importar
              igual y agregarlas después.
            </p>
          )}
          <div className="adm-tabla-scroll">
            <table className="adm-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precios</th>
                  <th>Foto</th>
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
                    <td>{p.foto ? (p.archivoFoto ? "✓" : "falta") : "—"}</td>
                    <td>{p.is_published ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="adm-ayuda">
            Los productos que ya existen (mismo nombre) se actualizan y sus
            precios se reemplazan por los de la planilla. Si algo falla, no se
            guarda nada.
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
          <Link to="/admin/productos">Ver productos →</Link>
        </div>
      )}
    </>
  );
}

export default Importar;
