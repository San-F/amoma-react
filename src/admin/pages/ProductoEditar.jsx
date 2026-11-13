// Ficha de un producto: foto, nombre, descripción, tamaños y precios, y si
// se muestra en la página. Todo se guarda junto (la base lo hace "todo o nada").
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  borrarProducto,
  cambiarFotoProducto,
  estaEnGaleria,
  guardarEncuadre,
  guardarProducto,
  listarCategorias,
  obtenerProducto,
  sumarAGaleria,
  usarFotoCargada,
} from "../lib/api";
import Encuadre from "../Encuadre";
import ElegirFoto from "../ElegirFoto";
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
  short_description: z.string().max(200, "Descripción: máx. 200 caracteres."),
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
    is_published: true,
    badge: "",
  });
  // se conservan tal cual (este formulario no los muestra)
  const [ocultos, setOcultos] = useState({
    description: null,
    is_featured: false,
  });
  const [variantes, setVariantes] = useState([{ ...VARIANTE_VACIA }]);
  const [portada, setPortada] = useState(null);
  const [enGaleria, setEnGaleria] = useState(false);
  const [eligiendo, setEligiendo] = useState(false);
  const [encuadrando, setEncuadrando] = useState(false);
  const [cargando, setCargando] = useState(!nuevo);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [avisoFoto, setAvisoFoto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const recargarFoto = async () => {
    const p = await obtenerProducto(id);
    const img = p.images.find((i) => i.is_cover) ?? p.images[0] ?? null;
    setPortada(img);
    setEnGaleria(img ? await estaEnGaleria(img.storage_path) : false);
    return img;
  };

  useEffect(() => {
    (async () => {
      try {
        setCategorias(await listarCategorias());
        if (!nuevo) {
          const p = await obtenerProducto(id);
          setForm({
            name: p.name,
            category_id: p.category_id ?? "",
            short_description: p.short_description ?? "",
            is_published: p.is_published,
            badge: p.badge ?? "",
          });
          setOcultos({
            description: p.description,
            is_featured: p.is_featured,
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
          await recargarFoto();
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setOk("");
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const cambiarVariante = (i, campo, valor) => {
    setOk("");
    setVariantes(
      variantes.map((v, j) => (j === i ? { ...v, [campo]: valor } : v)),
    );
  };

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
      return setError("Para mostrarlo en la página, cargá al menos un precio.");
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
          description: ocultos.description,
          is_published: form.is_published,
          is_featured: ocultos.is_featured,
          badge: form.badge || null,
        },
        listas,
      );
      if (nuevo) {
        navigate(`/admin/productos/${productoId}`, {
          replace: true,
          state: { recienCreado: true },
        });
        return;
      }
      setOk("Guardado ✓");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ---------- foto ----------
  const despuesDeFoto = async () => {
    const img = await recargarFoto();
    setAvisoFoto("Foto guardada ✓");
    // recién puesta: se ofrece acomodarla (es opcional)
    if (img) setEncuadrando(true);
  };

  const fotoNueva = async (file) => {
    setEligiendo(false);
    setError("");
    setAvisoFoto("");
    setSubiendo(true);
    try {
      await cambiarFotoProducto(id, file, form.name);
      await despuesDeFoto();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const fotoCargada = async (foto) => {
    setEligiendo(false);
    setError("");
    setAvisoFoto("");
    setSubiendo(true);
    try {
      await usarFotoCargada(id, foto, form.name);
      await despuesDeFoto();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const aGaleria = async () => {
    setError("");
    try {
      await sumarAGaleria(portada, form.name);
      setEnGaleria(true);
      setAvisoFoto("Sumada a la galería ✓");
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async () => {
    if (
      !window.confirm(
        `¿Borrar "${form.name}"? Deja de verse en la página y no se puede deshacer. (Si su foto está en la galería, ahí sigue.)`,
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

      {!nuevo && (
        <section className="adm-ficha-foto" aria-label="Foto">
          <button
            type="button"
            className="adm-ficha-foto__circulo"
            onClick={() =>
              portada ? setEncuadrando(true) : setEligiendo(true)
            }
            aria-label={portada ? "Acomodar esta foto" : "Poner una foto"}
            disabled={subiendo}
          >
            {portada ? (
              <img
                src={urlPublica(portada.storage_path)}
                alt=""
                style={estiloEncuadre(desdeFila(portada))}
              />
            ) : (
              <span>{subiendo ? "Subiendo…" : "+ Foto"}</span>
            )}
          </button>
          {!portada && !subiendo && (
            <p className="adm-aviso">
              Sin foto no aparece en la página. Tocá el círculo para ponerle
              una.
            </p>
          )}
          {subiendo && portada && <p className="adm-ayuda">Subiendo…</p>}
          {avisoFoto && (
            <p className="adm-ok" role="status">
              {avisoFoto}
            </p>
          )}
          {portada && (
            <div className="adm-ficha-foto__botones">
              <button
                type="button"
                className="adm-pildora"
                onClick={() => setEligiendo(true)}
                disabled={subiendo}
              >
                Cambiar foto
              </button>
              <button
                type="button"
                className="adm-pildora"
                onClick={() => setEncuadrando(true)}
              >
                Acomodar
              </button>
              {enGaleria ? (
                <span className="adm-pildora adm-pildora--lista">
                  ✓ En la galería
                </span>
              ) : (
                <button
                  type="button"
                  className="adm-pildora"
                  onClick={aGaleria}
                >
                  Sumar a la galería
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <form className="adm-ficha" onSubmit={guardar}>
        <div className="campo">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            className="adm-input-grande"
            maxLength={120}
            value={form.name}
            onChange={cambiar}
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="short_description">
            Descripción <small>(se ve en la tarjeta)</small>
          </label>
          <textarea
            id="short_description"
            name="short_description"
            rows="2"
            maxLength={200}
            value={form.short_description}
            onChange={cambiar}
          />
        </div>
        <div className="adm-ficha__dos">
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
              Etiqueta <small>(opcional)</small>
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
        </div>

        <h2 className="adm-ficha__sub">Tamaños y precios</h2>
        <ul className="adm-tamanos">
          {variantes.map((v, i) => (
            <li className="adm-tamano" key={i}>
              <input
                aria-label={`Tamaño ${i + 1}`}
                placeholder="Tamaño (ej. Mediana)"
                value={v.label}
                maxLength={60}
                onChange={(e) => cambiarVariante(i, "label", e.target.value)}
              />
              <input
                aria-label={`Porciones ${i + 1}`}
                placeholder="Porciones"
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
              <span className="adm-tamano__precio">
                <span aria-hidden="true">$</span>
                <input
                  aria-label={`Precio ${i + 1}`}
                  placeholder="35000"
                  inputMode="decimal"
                  value={v.precio}
                  onChange={(e) => cambiarVariante(i, "precio", e.target.value)}
                />
              </span>
              <button
                type="button"
                className="adm-icono-btn"
                aria-label={`Quitar tamaño ${i + 1}`}
                onClick={() => {
                  setOk("");
                  setVariantes(
                    variantes.length > 1
                      ? variantes.filter((_, j) => j !== i)
                      : [{ ...VARIANTE_VACIA }],
                  );
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="adm-link-fuerte"
          onClick={() => setVariantes([...variantes, { ...VARIANTE_VACIA }])}
        >
          + Agregar tamaño
        </button>

        <label className="adm-interruptor">
          <span>
            <b>Mostrar en la página</b>
            <small>Apagado, los clientes no lo ven (queda guardado acá).</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="is_published"
            checked={form.is_published}
            onChange={cambiar}
          />
        </label>

        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        <div className="adm-ficha__pie">
          {ok && (
            <p className="adm-ok" role="status">
              {ok}
            </p>
          )}
          <button className="btn btn--rosa" disabled={guardando}>
            {guardando
              ? "Guardando…"
              : nuevo
                ? "Crear producto"
                : "Guardar cambios"}
          </button>
        </div>
        {nuevo && (
          <p className="adm-ayuda">Después de crearlo le ponés la foto.</p>
        )}
        {!nuevo && (
          <button type="button" className="adm-borrar" onClick={eliminar}>
            Borrar producto
          </button>
        )}
      </form>

      {eligiendo && (
        <ElegirFoto
          titulo="Foto del producto"
          onElegir={fotoCargada}
          onArchivo={fotoNueva}
          onCerrar={() => setEligiendo(false)}
        />
      )}
      {encuadrando && portada && (
        <Encuadre
          src={urlPublica(portada.storage_path)}
          inicial={desdeFila(portada)}
          onCerrar={() => setEncuadrando(false)}
          onGuardar={async (enc) => {
            await guardarEncuadre(portada.id, enc);
            await recargarFoto();
            setEncuadrando(false);
            setAvisoFoto("Foto acomodada ✓");
          }}
        />
      )}
    </>
  );
}

export default ProductoEditar;
