import { useCallback, useEffect, useState } from "react";

// Carga datos con estados de "cargando" y "error" (nunca pantalla en blanco).
export function useCarga(fn, deps = []) {
  const [estado, setEstado] = useState({
    cargando: true,
    error: "",
    datos: null,
  });
  const cargar = useCallback(fn, deps);
  const recargar = useCallback(async () => {
    setEstado((e) => ({ ...e, cargando: true, error: "" }));
    try {
      setEstado({ cargando: false, error: "", datos: await cargar() });
    } catch (err) {
      setEstado({ cargando: false, error: err.message, datos: null });
    }
  }, [cargar]);
  useEffect(() => {
    recargar();
  }, [recargar]);
  return { ...estado, recargar };
}
