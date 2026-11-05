import "../styles/Ribbon.css";

const PALABRAS = ["Tortas", "Tartas", "Postres", "Salado", "Personalizadas"];

// Cinta editorial que pasa lento. Decorativa: los lectores de pantalla la ignoran.
function Ribbon() {
  const items = [...PALABRAS, ...PALABRAS];
  return (
    <div className="cinta" aria-hidden="true">
      <div className="cinta__pista">
        {[0, 1].map((copia) => (
          <div className="cinta__grupo" key={copia}>
            {items.map((t, i) => (
              <span key={i}>
                {t} <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ribbon;
