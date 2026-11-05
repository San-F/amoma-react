// Pantalla de bienvenida: se muestra una vez por visita (no en el panel).
// Archivo propio (no inline) para respetar la CSP estricta.
(function () {
  var d = document.documentElement;
  var visto = false;
  try {
    visto = sessionStorage.getItem("amoma-bienvenida") === "1";
  } catch {
    // sin almacenamiento (modo privado): se muestra igual
  }
  var reducir =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (visto || reducir || location.pathname.indexOf("/admin") === 0) {
    d.classList.add("sin-bienvenida");
    window.__cerrarBienvenida = function () {};
    return;
  }
  d.classList.add("bienvenida");
  var inicio = Date.now();
  var cerrada = false;
  function cerrar() {
    if (cerrada) return;
    cerrada = true;
    var espera = Math.max(0, 1700 - (Date.now() - inicio)); // se ve completa
    setTimeout(function () {
      d.classList.add("bienvenida-sale");
      d.classList.remove("bienvenida");
      try {
        sessionStorage.setItem("amoma-bienvenida", "1");
      } catch {
        // sin almacenamiento (modo privado): se muestra igual
      }
      setTimeout(function () {
        var el = document.getElementById("bienvenida");
        if (el) el.remove();
        d.classList.remove("bienvenida-sale");
      }, 1200);
    }, espera);
  }
  window.__cerrarBienvenida = cerrar;
  setTimeout(cerrar, 6000); // seguro: nunca queda trabada
})();
