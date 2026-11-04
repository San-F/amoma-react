import { useEffect } from "react";

// Título de la pestaña por página (ayuda a Google y a quien tiene muchas pestañas)
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo
      ? `${titulo} · Amoma`
      : "Amoma · Tortas caseras en Villa Pueyrredón, CABA";
  }, [titulo]);
}
