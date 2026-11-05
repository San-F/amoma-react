import { Component } from "react";

// Si una sección falla, solo esa sección muestra un aviso con "Reintentar";
// el resto de la página sigue funcionando (nunca pantalla en blanco).
class Seguro extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Falló una sección:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="seguro" role="alert">
        <p>Algo falló al mostrar esta parte.</p>
        <button
          type="button"
          className="btn btn--borde"
          onClick={() => this.setState({ error: null })}
        >
          Reintentar
        </button>
      </div>
    );
  }
}

export default Seguro;
