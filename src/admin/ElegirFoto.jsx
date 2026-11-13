// Ventana para elegir una foto: una de las que ya están cargadas (galería y
// productos) o una nueva desde el celular/compu.
import { useEffect, useRef, useState } from "react";
import { listarFotosCargadas } from "./lib/api";
import { validarImagen } from "./lib/images";
import { Icono } from "./Iconos";

function ElegirFoto({
  titulo = "Elegí una foto",
  textoSubir,
  onElegir,
  onArchivo,
  onCerrar,
}) {
  const ref = useRef(null);
  const [fotos, setFotos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    listarFotosCargadas().then(setFotos, (e) => setError(e.message));
    return () => d?.open && d.close();
  }, []);

  const archivo = (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const problema = validarImagen(f);
    if (problema) return setError(problema);
    onArchivo(f);
  };

  return (
    <dialog
      ref={ref}
      className="adm-elegir"
      aria-labelledby="elegir-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
    >
      <div className="adm-elegir__cabecera">
        <h2 id="elegir-titulo">{titulo}</h2>
        <button
          type="button"
          className="adm-icono-btn"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          <Icono nombre="cerrar" />
        </button>
      </div>
      <label className="btn btn--rosa adm-elegir__subir">
        <Icono nombre="mas" width={18} height={18} />{" "}
        {textoSubir ?? "Subir una foto nueva"}
        <input type="file" accept="image/*" onChange={archivo} hidden />
      </label>
      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}
      <p className="adm-ayuda">O tocá una de las que ya cargaste:</p>
      {!fotos && !error && <p className="adm-cargando">Cargando…</p>}
      {fotos && !fotos.length && (
        <p className="adm-ayuda">Todavía no hay fotos cargadas.</p>
      )}
      <ul className="adm-elegir__grilla">
        {fotos?.map((f) => (
          <li key={f.storage_path}>
            <button
              type="button"
              onClick={() => onElegir(f)}
              aria-label={`Usar la foto de ${f.etiqueta}`}
            >
              <img src={f.url} alt="" loading="lazy" />
              <span>{f.etiqueta}</span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

export default ElegirFoto;
