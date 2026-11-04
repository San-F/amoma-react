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

function Galeria() {
  const { cargando, error, datos, recargar } = useCarga(listarGaleria);
  const [aviso, setAviso] = useState("");
  const [subiendo, setSubiendo] = useState("");

  const accion = async (fn) => {
    setAviso("");
    try {
      await fn();
      await recargar();
    } catch (e) {
      setAviso(e.message);
    }
  };

  const subir = async (e) => {
    const archivos = [...e.target.files];
    e.target.value = "";
    for (const f of archivos) {
      const problema = validarImagen(f);
      if (problema) return setAviso(problema);
    }
    let orden = datos?.length ?? 0;
    await accion(async () => {
      for (const [i, f] of archivos.entries()) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
        await agregarFotoGaleria(f, "Torta de Amoma", orden++);
      }
    });
    setSubiendo("");
  };

  const mover = (i, paso) => {
    const lista = [...datos];
    const j = i + paso;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    accion(() => reordenarGaleria(lista));
  };

  return (
    <>
      <h1 className="adm-titulo">Galería</h1>
      <p className="adm-ayuda">
        Trabajos que aparecen en la página “Galería”. Las primeras 3 se muestran
        también en “Tortas personalizadas”. Escribí una descripción corta de
        cada foto: la leen Google y las personas con lectores de pantalla.
      </p>
      {aviso && (
        <p className="adm-error" role="alert">
          {aviso}
        </p>
      )}
      <label className="btn adm-subir adm-acciones">
        {subiendo || "+ Agregar fotos"}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={subir}
          disabled={Boolean(subiendo)}
        />
      </label>
      <Estado
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={
          datos &&
          !datos.length &&
          "Todavía no hay fotos. Mientras tanto la página muestra las de ejemplo."
        }
      >
        <ul className="adm-lista">
          {datos?.map((g, i) => (
            <li key={g.id} className="adm-fila adm-fila--galeria">
              <img src={g.url} alt="" className="adm-mini adm-mini--cuadrada" />
              <div className="adm-fila__info">
                <input
                  className="adm-inline"
                  aria-label="Descripción de la foto"
                  defaultValue={g.alt_text}
                  maxLength={200}
                  onBlur={(e) =>
                    e.target.value.trim() !== g.alt_text &&
                    accion(() =>
                      cambiarFotoGaleria(g.id, {
                        alt_text: e.target.value.trim(),
                      }),
                    )
                  }
                />
                <div className="adm-fila__botones">
                  <button
                    type="button"
                    className="adm-x"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="adm-x"
                    aria-label="Bajar"
                    disabled={i === datos.length - 1}
                    onClick={() => mover(i, 1)}
                  >
                    ↓
                  </button>
                  <label className="adm-switch">
                    <input
                      type="checkbox"
                      checked={g.is_published}
                      onChange={() =>
                        accion(() =>
                          cambiarFotoGaleria(g.id, {
                            is_published: !g.is_published,
                          }),
                        )
                      }
                    />
                    <span>{g.is_published ? "Visible" : "Oculta"}</span>
                  </label>
                  <button
                    type="button"
                    className="adm-link adm-peligro-texto"
                    onClick={() =>
                      window.confirm("¿Borrar esta foto?") &&
                      accion(() => borrarFotoGaleria(g))
                    }
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Estado>
    </>
  );
}

export default Galeria;
