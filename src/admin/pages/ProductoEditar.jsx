import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  agregarImagen,
  borrarImagen,
  borrarProducto,
  guardarEncuadre,
  guardarProducto,
  listarCategorias,
  marcarPortada,
  obtenerProducto,
} from "../lib/api";
import { validarImagen } from "../lib/images";
import Encuadre from "../Encuadre";
import { desdeFila, estiloEncuadre } from "../../lib/encuadre";
import { urlPublica } from "../../lib/supabase";
import { pesosACentavos } from "../../lib/money";
import { slugify } from "../../lib/slug";

// Validación del formulario (la base vuelve a validar con sus CHECK)
const esquema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Poné un nombre.")
    .max(120, "Nombre muy largo."),
  short_description: z
    .string()
    .max(200, "Descripción corta: máx. 200 caracteres."),
  description: z.string().max(3000, "Descripción: máx. 3000 caracteres."),
});

const VARIANTE_VACIA = { label: "", servings: "", precio: "" };

function ProductoEditar() {
  const { id } = useParams();
  const nuevo = id === "nuevo";
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    short_description: "",
    description: "",
    is_published: false,
    is_featured: false,
    badge: "",
  });
  const [variantes, setVariantes] = useState([{ ...VARIANTE_VACIA }]);
  const [imagenes, setImagenes] = useState([]);
  // foto que se está acomodando (ventana de encuadre abierta)
  const [encuadrando, setEncuadrando] = useState(null);
  const [cargando, setCargando] = useState(!nuevo);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = async () => {
    try {
      setCategorias(await listarCategorias());
      if (!nuevo) {
        const p = await obtenerProducto(id);
        setForm({
          name: p.name,
          category_id: p.category_id ?? "",
          short_description: p.short_description ?? "",
          description: p.description ?? "",
          is_published: p.is_published,
          is_featured: p.is_featured,
          badge: p.badge ?? "",
        });
        setVariantes(
          p.variants.length
            ? p.variants.map((v) => ({
                label: v.label,
                servings: v.servings ?? "",
                precio: String(v.price_cents / 100),
              }))
            : [{ ...VARIANTE_VACIA }],
        );
        setImagenes(p.images);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const cambiarVariante = (i, campo, valor) =>
    setVariantes(
      variantes.map((v, j) => (j === i ? { ...v, [campo]: valor } : v)),
    );

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    const r = esquema.safeParse(form);
    if (!r.success) return setError(r.error.issues[0].message);

    const filas = variantes.filter((v) => v.label.trim() || v.precio.trim());
    const listas = [];
    for (const [i, v] of filas.entries()) {
      const precio = pesosACentavos(v.precio);
      if (!v.label.trim())
        return setError(`Precio ${i + 1}: falta el tamaño (ej. "Mediana").`);
      if (precio == null)
        return setError(
          `Precio ${i + 1}: "${v.precio}" no es un precio válido (ej. 18000).`,
        );
      const porciones =
        v.servings === "" ? null : Number.parseInt(v.servings, 10);
      if (porciones != null && !(porciones > 0 && porciones <= 1000))
        return setError(`Precio ${i + 1}: porciones tiene que ser un número.`);
      listas.push({
        label: v.label.trim().slice(0, 60),
        servings: porciones,
        price_cents: precio,
      });
    }
    if (form.is_published && !listas.length)
      return setError("Para publicarlo, cargá al menos un precio.");
    if (nuevo && !slugify(r.data.name))
      return setError("El nombre tiene que tener letras o números.");

    setGuardando(true);
    try {
      const productoId = await guardarProducto(
        {
          // el identificador (slug) se fija al crear y no cambia al renombrar
          ...(nuevo ? { slug: slugify(r.data.name) } : { id }),
          name: r.data.name,
          category_id: form.category_id || null,
          short_description: r.data.short_description || null,
          description: r.data.description || null,
          is_published: form.is_published,
          is_featured: form.is_featured,
          badge: form.badge || null,
        },
        listas,
      );
      setOk("Guardado ✓");
      if (nuevo) navigate(`/admin/productos/${productoId}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const subir = async (e) => {
    const archivos = [...e.target.files];
    e.target.value = "";
    setError("");
    for (const f of archivos) {
      const problema = validarImagen(f);
      if (problema) return setError(problema);
    }
    setSubiendo(true);
    try {
      let hayPortada = imagenes.some((i) => i.is_cover);
      let primera = null;
      for (const f of archivos) {
        const nueva = await agregarImagen(id, f, form.name, !hayPortada);
        primera ??= nueva;
        hayPortada = true;
      }
      const lista = (await obtenerProducto(id)).images;
      setImagenes(lista);
      // recién subida: se abre para acomodarla dentro del círculo
      setEncuadrando(lista.find((i) => i.id === primera) ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const accionImagen = async (fn) => {
    setError("");
    try {
      await fn();
      setImagenes((await obtenerProducto(id)).images);
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async () => {
    if (
      !window.confirm(
        `¿Borrar "${form.name}" y sus fotos? No se puede deshacer.`,
      )
    )
      return;
    try {
      await borrarProducto(id);
      navigate("/admin/productos", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  if (cargando) return <p className="adm-cargando">Cargando…</p>;

  return (
    <>
      <Link to="/admin/productos" className="adm-volver">
        ← Productos
      </Link>
      <h1 className="adm-titulo">
        {nuevo ? "Nuevo producto" : form.name || "Producto"}
      </h1>

      <form className="adm-form" onSubmit={guardar}>
        <section className="adm-bloque">
          <div className="campo">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              maxLength={120}
              value={form.name}
              onChange={cambiar}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="category_id">Categoría</label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={cambiar}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="badge">
              Etiqueta <small>(opcional, se ve en la tarjeta)</small>
            </label>

            <select
              id="badge"
              name="badge"
              value={form.badge}
              onChange={cambiar}
            >
              <option value="">Sin etiqueta</option>

              <option value="mas-pedido">Más pedido</option>

              <option value="nuevo">Nuevo</option>

              <option value="temporada">De temporada</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="short_description">
              Descripción corta <small>(se ve en la tarjeta)</small>
            </label>
            <input
              id="short_description"
              name="short_description"
              maxLength={200}
              value={form.short_description}
              onChange={cambiar}
            />
          </div>
          <div className="campo">
            <label htmlFor="description">
              Descripción larga <small>(opcional)</small>
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              maxLength={3000}
              value={form.description}
              onChange={cambiar}
            />
          </div>
        </section>

        <section className="adm-bloque">
          <h2>Tamaños y precios</h2>
          <div className="adm-variantes">
            <span>Tamaño</span>
            <span>Porciones</span>
            <span>Precio ($)</span>
            <span />
            {variantes.map((v, i) => (
              <div className="adm-variante" key={i}>
                <input
                  aria-label={`Tamaño ${i + 1}`}
                  placeholder="Mediana"
                  value={v.label}
                  maxLength={60}
                  onChange={(e) => cambiarVariante(i, "label", e.target.value)}
                />
                <input
                  aria-label={`Porciones ${i + 1}`}
                  placeholder="15"
                  inputMode="numeric"
                  value={v.servings}
                  onChange={(e) =>
                    cambiarVariante(
                      i,
                      "servings",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                />
                <input
                  aria-label={`Precio ${i + 1}`}
                  placeholder="35000"
                  inputMode="decimal"
                  value={v.precio}
                  onChange={(e) => cambiarVariante(i, "precio", e.target.value)}
                />
                <button
                  type="button"
                  className="adm-x"
                  aria-label={`Quitar precio ${i + 1}`}
                  onClick={() =>
                    setVariantes(variantes.filter((_, j) => j !== i))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="adm-link"
            onClick={() => setVariantes([...variantes, { ...VARIANTE_VACIA }])}
          >
            + Agregar tamaño
          </button>
        </section>

        <section className="adm-bloque adm-bloque--fila">
          <label className="adm-switch">
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={cambiar}
            />
            <span>Visible en la página</span>
          </label>
          <label className="adm-switch">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={cambiar}
            />
            <span>Destacado</span>
          </label>
        </section>

        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        {ok && <p className="adm-ok">{ok}</p>}
        <div className="adm-acciones">
          <button className="btn" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {!nuevo && (
            <button
              type="button"
              className="btn btn--borde adm-peligro"
              onClick={eliminar}
            >
              Borrar producto
            </button>
          )}
        </div>
      </form>

      {!nuevo && (
        <section className="adm-bloque">
          <h2>Fotos</h2>
          {!imagenes.length && (
            <p className="adm-aviso">
              Todavía no tiene foto: hasta que le pongas una, no aparece en la
              página.
            </p>
          )}
          <p className="adm-ayuda">
            Se achican solas antes de subir. La marcada con ★ es la portada.
            Tocá una foto para acomodarla dentro del círculo.
          </p>
          <ul className="adm-fotos">
            {imagenes.map((img) => (
              <li key={img.id}>
                <button
                  type="button"
                  className="adm-fotos__ver"
                  onClick={() => setEncuadrando(img)}
                  aria-label="Acomodar esta foto"
                >
                  <img
                    src={urlPublica(img.storage_path)}
                    alt={img.alt_text}
                    style={estiloEncuadre(desdeFila(img))}
                  />
                  <span className="adm-fotos__acomodar">Acomodar</span>
                </button>
                <div>
                  <button
                    type="button"
                    className={
                      img.is_cover ? "adm-estrella is-on" : "adm-estrella"
                    }
                    aria-label={
                      img.is_cover ? "Es la portada" : "Usar como portada"
                    }
                    onClick={() =>
                      accionImagen(() => marcarPortada(id, img.id))
                    }
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    className="adm-x"
                    aria-label="Borrar foto"
                    onClick={() =>
                      window.confirm("¿Borrar esta foto?") &&
                      accionImagen(() => borrarImagen(img))
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <label className="btn btn--borde adm-subir">
            {subiendo ? "Subiendo…" : "+ Agregar fotos"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={subir}
              disabled={subiendo}
              hidden
            />
          </label>
        </section>
      )}
      {encuadrando && (
        <Encuadre
          src={urlPublica(encuadrando.storage_path)}
          inicial={desdeFila(encuadrando)}
          onCerrar={() => setEncuadrando(null)}
          onGuardar={async (enc) => {
            await guardarEncuadre(encuadrando.id, enc);
            setImagenes((await obtenerProducto(id)).images);
            setEncuadrando(null);
          }}
        />
      )}
      {nuevo && (
        <p className="adm-ayuda">
          Guardá el producto para poder agregarle fotos.
        </p>
      )}
    </>
  );
}

export default ProductoEditar;
