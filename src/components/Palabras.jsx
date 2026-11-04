import { Children, isValidElement } from "react";

// Envuelve cada palabra de un título para revelarla como una cortina,
// una tras otra. Se activa cuando un <Reveal> padre entra en pantalla
// (clase .is-visible) o, en la portada, apenas carga (.palabras--ya).
function Palabras({ children }) {
  let n = 0;
  const envolver = (contenido, clave) => (
    <span className="palabra" key={clave}>
      <span style={{ "--w": n++ }}>{contenido}</span>
    </span>
  );
  return Children.toArray(children).flatMap((nodo, i) => {
    if (typeof nodo === "string") {
      return nodo
        .split(/(\s+)/)
        .map((t, k) =>
          /^\s+$/.test(t) || t === "" ? t : envolver(t, `${i}-${k}`),
        );
    }
    if (isValidElement(nodo) && nodo.type === "br") return nodo;
    return envolver(nodo, `${i}`);
  });
}

export default Palabras;
