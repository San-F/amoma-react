// Mensajes de carga / error / vacío reutilizables.
export function Estado({ cargando, error, vacio, onReintentar, children }) {
  if (cargando) return <p className="adm-cargando">Cargando…</p>;
  if (error)
    return (
      <div className="adm-error" role="alert">
        <p>{error}</p>
        {onReintentar && (
          <button type="button" className="adm-link" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    );
  if (vacio) return <p className="adm-vacio">{vacio}</p>;
  return children;
}
