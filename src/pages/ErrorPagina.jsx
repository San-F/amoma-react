// Si falla la página entera (o una ruta), se muestra esto en vez de una pantalla en blanco.
function ErrorPagina() {
  return (
    <main className="seguro seguro--pagina" role="alert">
      <p className="seguro__titulo">Ups, algo falló</p>
      <p>Probá recargar. Si sigue pasando, escribinos por WhatsApp.</p>
      <button
        type="button"
        className="btn"
        onClick={() => window.location.reload()}
      >
        Recargar
      </button>
    </main>
  );
}

export default ErrorPagina;
