// Fotos: la galería de la página, como un feed. Se muestra u oculta cada
// foto, se cambia el orden y se suben varias juntas. Las primeras 3 visibles
// aparecen también en "Tortas personalizadas".
import { useState } from "react";
import {
  agregarFotoGaleria,
  borrarFotoGaleria,
  cambiarFotoGaleria,
  listarGaleria,
  reordenarGaleria,
} from "../lib/api";
import { validarImagen } from "../lib/images";
import { useCarga } from "../lib/useCarga";
import { Estado } from "../Estado";
import { Icono } from "../Iconos";

function Galeria() {
  const { cargando, error, datos, recargar } = useCarga(listarGaleria);
  const [aviso, setAviso] = useState("");
  const [ok, setOk] = useState("");
  const [subiendo, setSubiendo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const fotos = datos ?? [];
  const visibles = fotos.filter((g) => g.is_published).length;

  const accion = async (fn, mensaje = "") => {
    setAviso("");
    setOk("");
    setOcupado(true);
    try {
      await fn();
      await recargar();
      setOk(mensaje);
    } catch (e) {
      setAviso(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const subir = async (e) => {
    const archivos = [...e.target.files];
    e.target.value = "";
    for (const f of archivos) {
      const problema = validarImagen(f);
      if (problema) return setAviso(problema);
    }
    let orden = fotos.length
      ? Math.max(...fotos.map((g) => g.sort_order)) + 1
      : 0;
    await accion(
      async () => {
        for (const [i, f] of archivos.entries()) {
          setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
          await agregarFotoGaleria(f, "Torta de Amoma", orden++);
        }
      },
      archivos.length === 1
        ? "Foto subida ✓"
        : `${archivos.length} fotos subidas ✓`,
    );
    setSubiendo("");
  };

  const mover = (i, paso) => {
    const lista = [...fotos];
    const j = i + paso;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    accion(() => reordenarGaleria(lista));
  };

  return (
    <>
      <div className="adm-cabecera">
        <h1 className="adm-titulo">Fotos</h1>
        <label className="btn btn--rosa" aria-busy={Boolean(subiendo)}>
          <Icono nombre="mas" width={18} height={18} /> {subiendo || "Subir"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={subir}
            disabled={Boolean(subiendo) || ocupado}
            hidden
          />
        </label>
      </div>
      <p className="adm-ayuda">
        Es la galería de la página: fotos grandes y completas, ideal para tortas
        personalizadas. Elegí cuáles se ven con el ojito y cambiá el orden con
        las flechas. Las primeras 3 visibles salen también en “Tortas
        personalizadas”.
      </p>
      {aviso && (
        <p className="adm-error" role="alert">
          {aviso}
        </p>
      )}
      {ok && (
        <p className="adm-ok" role="status">
          {ok}
        </p>
      )}
      <Estado
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={
          datos &&
          !fotos.length &&
          "Todavía no hay fotos. Tocá “Subir” para agregar las primeras."
        }
      >
        <p className="adm-estado">
          {visibles} de {fotos.length} a la vista en la página
        </p>
        <ul className="adm-feed">
          {fotos.map((g, i) => (
            <li key={g.id} className={g.is_published ? "" : "adm-feed__oculta"}>
              <img src={g.url} alt={g.alt_text} loading="lazy" />
              {!g.is_published && (
                <span className="adm-etiqueta adm-feed__etiqueta">Oculta</span>
              )}
              <div className="adm-feed__botones">
                <button
                  type="button"
                  className="adm-icono-btn"
                  aria-label={
                    g.is_published
                      ? `Ocultar foto ${i + 1}`
                      : `Mostrar foto ${i + 1}`
                  }
                  aria-pressed={!g.is_published}
                  disabled={ocupado}
                  onClick={() =>
                    accion(
                      () =>
                        cambiarFotoGaleria(g.id, {
                          is_published: !g.is_published,
                        }),
                      g.is_published
                        ? "Foto oculta ✓ (sigue guardada acá)"
                        : "Foto visible ✓",
                    )
                  }
                >
                  <Icono nombre={g.is_published ? "ojo" : "ojoTachado"} />
                </button>
                <button
                  type="button"
                  className="adm-icono-btn"
                  aria-label={`Mover foto ${i + 1} antes`}
                  disabled={i === 0 || ocupado}
                  onClick={() => mover(i, -1)}
                >
                  <Icono nombre="izq" />
                </button>
                <button
                  type="button"
                  className="adm-icono-btn"
                  aria-label={`Mover foto ${i + 1} después`}
                  disabled={i === fotos.length - 1 || ocupado}
                  onClick={() => mover(i, 1)}
                >
                  <Icono nombre="der" />
                </button>
                <button
                  type="button"
                  className="adm-icono-btn adm-icono-btn--peligro"
                  aria-label={`Borrar foto ${i + 1}`}
                  disabled={ocupado}
                  onClick={() =>
                    window.confirm(
                      "¿Borrar esta foto de la galería? Si la usa un producto, ahí sigue.",
                    ) && accion(() => borrarFotoGaleria(g), "Foto borrada ✓")
                  }
                >
                  <Icono nombre="cerrar" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Estado>
    </>
  );
}

export default Galeria;
