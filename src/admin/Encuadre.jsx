import { useEffect, useId, useRef, useState } from "react";
import {
  CENTRADO,
  ZOOM_MAX,
  estiloEncuadre,
  mover,
  normalizar,
} from "../lib/encuadre";

// Ventana para acomodar una foto dentro del círculo, viendo cómo va a quedar
// en la página. Se arrastra con el dedo/mouse (o flechas del teclado) y se
// acerca con la barra. Al guardar, devuelve { x, y, zoom }.
function Encuadre({ src, inicial, onGuardar, onCerrar }) {
  const uid = useId();
  const dialogRef = useRef(null);
  const circuloRef = useRef(null);
  const arrastre = useRef(null);
  const [enc, setEnc] = useState(() => normalizar(inicial));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.open && d.close();
  }, []);

  const empezar = (e) => {
    e.preventDefault();
    circuloRef.current.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY };
  };
  const arrastrar = (e) => {
    if (!arrastre.current) return;
    const caja = circuloRef.current.clientWidth;
    const dx = e.clientX - arrastre.current.x;
    const dy = e.clientY - arrastre.current.y;
    arrastre.current = { x: e.clientX, y: e.clientY };
    setEnc((v) => mover(v, dx, dy, caja));
  };
  const soltar = () => (arrastre.current = null);

  const teclado = (e) => {
    const pasos = {
      ArrowLeft: [-8, 0],
      ArrowRight: [8, 0],
      ArrowUp: [0, -8],
      ArrowDown: [0, 8],
    };
    if (!pasos[e.key]) return;
    e.preventDefault();
    const [dx, dy] = pasos[e.key];
    setEnc((v) => mover(v, dx, dy, circuloRef.current.clientWidth));
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      await onGuardar(enc);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const estilo = estiloEncuadre(enc);

  return (
    <dialog
      ref={dialogRef}
      className="adm-encuadre"
      aria-labelledby={`${uid}-t`}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <h2 id={`${uid}-t`}>Acomodá la foto</h2>
      <p className="adm-ayuda">
        Arrastrá la foto para moverla y usá la barra para acercarla. Así se va a
        ver en la página.
      </p>

      <div className="adm-encuadre__vistas">
        <div
          ref={circuloRef}
          className="adm-encuadre__circulo"
          role="application"
          tabIndex={0}
          aria-label="Foto: arrastrá o usá las flechas para moverla"
          onPointerDown={empezar}
          onPointerMove={arrastrar}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={teclado}
        >
          <img src={src} alt="" draggable={false} style={estilo} />
        </div>
        <div className="adm-encuadre__chica" aria-hidden="true">
          <div>
            <img src={src} alt="" style={estilo} />
          </div>
          <small>En la tarjeta</small>
        </div>
      </div>

      <label className="adm-encuadre__zoom" htmlFor={`${uid}-zoom`}>
        <span>Acercar</span>
        <input
          id={`${uid}-zoom`}
          type="range"
          min="1"
          max={ZOOM_MAX}
          step="0.01"
          value={enc.zoom}
          onChange={(e) =>
            setEnc((v) => normalizar({ ...v, zoom: e.target.value }))
          }
        />
      </label>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      <div className="adm-encuadre__acciones">
        <button
          type="button"
          className="adm-link"
          onClick={() => setEnc(CENTRADO)}
        >
          Centrar
        </button>
        <span />
        <button type="button" className="btn btn--borde" onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn--rosa"
          onClick={guardar}
          disabled={guardando}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </dialog>
  );
}

export default Encuadre;
