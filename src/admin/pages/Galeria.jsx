// Fotos: la galería de la página, como un feed.
// - El ojito muestra/oculta al instante y guarda por detrás (si falla, vuelve).
// - "Ordenar": se arrastran las fotos y recién "Guardar orden" guarda.
// Las primeras 3 visibles aparecen también en "Tortas personalizadas".
import { useEffect, useRef, useState } from "react";
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
  const [fotos, setFotos] = useState([]);
  const [aviso, setAviso] = useState("");
  const [estado, setEstado] = useState(""); // "Guardando…" / "Guardado ✓"
  const [subiendo, setSubiendo] = useState("");
  const [ordenando, setOrdenando] = useState(false);
  const [antesDeOrdenar, setAntesDeOrdenar] = useState(null);
  const [arrastrada, setArrastrada] = useState(null); // índice
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (datos) setFotos(datos);
  }, [datos]);

  const avisarGuardado = (texto = "Guardado ✓") => {
    setEstado(texto);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setEstado(""), 2200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const visibles = fotos.filter((g) => g.is_published).length;

  // ---------- ojito: al instante ----------
  const alternar = async (g) => {
    setAviso("");
    const nuevo = !g.is_published;
    setFotos((l) =>
      l.map((x) => (x.id === g.id ? { ...x, is_published: nuevo } : x)),
    );
    setEstado("Guardando…");
    try {
      await cambiarFotoGaleria(g.id, { is_published: nuevo });
      avisarGuardado(nuevo ? "Visible ✓" : "Oculta ✓ (sigue guardada acá)");
    } catch (e) {
      // volver atrás: lo que se ve tiene que ser lo que está guardado
      setFotos((l) =>
        l.map((x) => (x.id === g.id ? { ...x, is_published: !nuevo } : x)),
      );
      setEstado("");
      setAviso(e.message);
    }
  };

  // ---------- subir y borrar ----------
  const subir = async (e) => {
    const archivos = [...e.target.files];
    e.target.value = "";
    setAviso("");
    for (const f of archivos) {
      const problema = validarImagen(f);
      if (problema) return setAviso(problema);
    }
    let orden = fotos.length
      ? Math.max(...fotos.map((g) => g.sort_order)) + 1
      : 0;
    try {
      for (const [i, f] of archivos.entries()) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
        await agregarFotoGaleria(f, "Torta de Amoma", orden++);
      }
      await recargar();
      avisarGuardado(
        archivos.length === 1
          ? "Foto subida ✓"
          : `${archivos.length} fotos subidas ✓`,
      );
    } catch (err) {
      setAviso(err.message);
      await recargar();
    } finally {
      setSubiendo("");
    }
  };

  const borrar = async (g) => {
    if (
      !window.confirm(
        "¿Borrar esta foto de la galería? Si la usa un producto, ahí sigue.",
      )
    )
      return;
    setAviso("");
    const antes = fotos;
    setFotos((l) => l.filter((x) => x.id !== g.id));
    setEstado("Guardando…");
    try {
      await borrarFotoGaleria(g);
      avisarGuardado("Foto borrada ✓");
    } catch (e) {
      setFotos(antes);
      setEstado("");
      setAviso(e.message);
    }
  };

  // ---------- ordenar ----------
  const empezarAOrdenar = () => {
    setAviso("");
    setAntesDeOrdenar(fotos);
    setOrdenando(true);
  };
  const cancelarOrden = () => {
    setFotos(antesDeOrdenar);
    setOrdenando(false);
  };
  const guardarOrden = async () => {
    setGuardandoOrden(true);
    try {
      await reordenarGaleria(fotos);
      await recargar();
      setOrdenando(false);
      avisarGuardado("Orden guardado ✓");
    } catch (e) {
      setAviso(e.message);
    } finally {
      setGuardandoOrden(false);
    }
  };
  const moverA = (desde, hasta) => {
    if (desde === hasta || hasta < 0 || hasta >= fotos.length) return;
    setFotos((l) => {
      const copia = [...l];
      const [x] = copia.splice(desde, 1);
      copia.splice(hasta, 0, x);
      return copia;
    });
  };

  // arrastrar con el dedo o el mouse desde la manija (el resto de la foto
  // deja hacer scroll normal en el celular)
  const empezarArrastre = (e, i) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrada(i);
  };
  const arrastrar = (e) => {
    if (arrastrada === null) return;
    const debajo = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-indice]");
    if (!debajo) return;
    const destino = Number(debajo.dataset.indice);
    if (destino !== arrastrada) {
      moverA(arrastrada, destino);
      setArrastrada(destino);
    }
  };
  const soltar = () => setArrastrada(null);

  return (
    <>
      <div className="adm-cabecera">
        <h1 className="adm-titulo">Fotos</h1>
        {!ordenando && (
          <label className="btn btn--rosa" aria-busy={Boolean(subiendo)}>
            <Icono nombre="mas" width={18} height={18} /> {subiendo || "Subir"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={subir}
              disabled={Boolean(subiendo)}
              hidden
            />
          </label>
        )}
      </div>

      {ordenando ? (
        <div className="adm-ordenar" role="status">
          <p>
            <b>Arrastrá las fotos</b> desde la manija{" "}
            <Icono nombre="arrastrar" width={16} height={16} /> para cambiar el
            orden. Recién se guarda al tocar “Guardar orden”.
          </p>
          <div className="adm-ordenar__botones">
            <button
              type="button"
              className="btn btn--borde"
              onClick={cancelarOrden}
              disabled={guardandoOrden}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--rosa"
              onClick={guardarOrden}
              disabled={guardandoOrden}
            >
              {guardandoOrden ? "Guardando…" : "Guardar orden"}
            </button>
          </div>
        </div>
      ) : (
        <p className="adm-ayuda">
          Es la galería de la página: fotos grandes y completas, ideal para
          tortas personalizadas. Con el ojito elegís cuáles se ven.
        </p>
      )}

      {aviso && (
        <p className="adm-error" role="alert">
          {aviso}
        </p>
      )}
      <Estado
        cargando={cargando && !fotos.length}
        error={error}
        onReintentar={recargar}
        vacio={
          datos &&
          !fotos.length &&
          "Todavía no hay fotos. Tocá “Subir” para agregar las primeras."
        }
      >
        <div className="adm-feed__barra">
          <p className="adm-estado">
            {visibles} de {fotos.length} a la vista en la página
          </p>
          {!ordenando && fotos.length > 1 && (
            <button
              type="button"
              className="adm-pildora"
              onClick={empezarAOrdenar}
            >
              <Icono nombre="arrastrar" width={16} height={16} /> Ordenar
            </button>
          )}
        </div>
        <ul
          className={`adm-feed ${ordenando ? "adm-feed--ordenando" : ""}`}
          onPointerMove={ordenando ? arrastrar : undefined}
          onPointerUp={ordenando ? soltar : undefined}
          onPointerCancel={ordenando ? soltar : undefined}
        >
          {fotos.map((g, i) => (
            <li
              key={g.id}
              data-indice={i}
              className={[
                g.is_published ? "" : "adm-feed__oculta",
                arrastrada === i ? "adm-feed__arrastrada" : "",
              ].join(" ")}
            >
              <img
                src={g.url}
                alt={g.alt_text}
                loading="lazy"
                draggable="false"
              />
              {!g.is_published && (
                <span className="adm-etiqueta adm-feed__etiqueta">Oculta</span>
              )}
              {ordenando ? (
                <div className="adm-feed__orden">
                  <span className="adm-feed__numero">{i + 1}</span>
                  <button
                    type="button"
                    className="adm-icono-btn adm-feed__manija"
                    aria-label={`Arrastrar foto ${i + 1}`}
                    onPointerDown={(e) => empezarArrastre(e, i)}
                    onKeyDown={(e) => {
                      // con teclado: flechas para mover
                      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                        e.preventDefault();
                        moverA(i, i - 1);
                      }
                      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                        e.preventDefault();
                        moverA(i, i + 1);
                      }
                    }}
                  >
                    <Icono nombre="arrastrar" />
                  </button>
                </div>
              ) : (
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
                    onClick={() => alternar(g)}
                  >
                    <Icono nombre={g.is_published ? "ojo" : "ojoTachado"} />
                  </button>
                  <button
                    type="button"
                    className="adm-icono-btn adm-icono-btn--peligro"
                    aria-label={`Borrar foto ${i + 1}`}
                    onClick={() => borrar(g)}
                  >
                    <Icono nombre="cerrar" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Estado>

      {estado && (
        <p className="adm-toast" role="status">
          {estado}
        </p>
      )}
    </>
  );
}

export default Galeria;
