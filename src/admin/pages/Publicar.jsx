// Publicar: arma la imagen para Instagram con la estética de la marca y la
// descarga. Todo pasa en el celular/compu: no se conecta a Instagram ni a
// otro servicio, y la imagen armada no se guarda en ningún lado.
import { useEffect, useRef, useState } from "react";
import { agregarFotoGaleria, listarProductos, sumarAGaleria } from "../lib/api";
import {
  cargarImagen,
  cargarLetras,
  dibujarPublicacion,
  partirNombre,
} from "../lib/publicacion";
import ElegirFoto from "../ElegirFoto";
import { Icono } from "../Iconos";
import { formatearPrecio } from "../../lib/money";
import { slugify } from "../../lib/slug";

const MODELOS = [
  { id: "vitrina", nombre: "Vitrina" },
  { id: "portada", nombre: "Portada" },
];

// Botones de a dos (como un interruptor con texto)
function Opciones({ titulo, valor, opciones, onCambio }) {
  return (
    <fieldset className="adm-seg">
      <legend>{titulo}</legend>
      <div>
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            onClick={() => onCambio(o.id)}
          >
            {o.nombre}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Publicar() {
  const canvasRef = useRef(null);
  const miniRefs = useRef({});
  const [productos, setProductos] = useState(null);
  const [logo, setLogo] = useState(null);
  const [listo, setListo] = useState(false); // letras + logo cargados
  // de dónde sale la foto: { tipo: "producto"|"cargada"|"archivo", ... }
  const [fuente, setFuente] = useState(null);
  const [foto, setFoto] = useState(null); // imagen ya cargada para dibujar
  const [modelo, setModelo] = useState("vitrina");
  const [color, setColor] = useState("crema");
  const [formato, setFormato] = useState("cuadrado");
  const [textos, setTextos] = useState({
    linea1: "",
    linea2: "",
    precio: "",
    desde: true,
  });
  const [aGaleria, setAGaleria] = useState(false);
  const [eligiendo, setEligiendo] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  // productos con foto + letras + logo
  useEffect(() => {
    (async () => {
      try {
        const [lista, logoImg] = await Promise.all([
          listarProductos(),
          cargarImagen("/logo.png"),
          cargarLetras(),
        ]);
        const conFoto = lista.filter((p) => p.portada);
        setProductos(conFoto);
        setLogo(logoImg);
        setListo(true);
        if (conFoto[0]) elegirProducto(conFoto[0]);
      } catch (e) {
        setError(e.message);
        setListo(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar la foto elegida
  useEffect(() => {
    if (!fuente) return;
    let vivo = true;
    let url = null;
    const src =
      fuente.tipo === "archivo"
        ? (url = URL.createObjectURL(fuente.archivo))
        : fuente.url;
    setFoto(null);
    cargarImagen(src).then(
      (img) => vivo && setFoto(img),
      (e) => vivo && setError(e.message),
    );
    return () => {
      vivo = false;
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }, [fuente]);

  const opciones = {
    modelo,
    color,
    formato,
    foto,
    logo,
    encuadre: fuente?.encuadre ?? undefined,
    textos,
  };

  // vista grande + miniaturas de los modelos
  useEffect(() => {
    if (!listo || !canvasRef.current) return;
    dibujarPublicacion(canvasRef.current, opciones);
    for (const m of MODELOS) {
      const c = miniRefs.current[m.id];
      if (c) dibujarPublicacion(c, { ...opciones, modelo: m.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, modelo, color, formato, foto, logo, textos, fuente]);

  function elegirProducto(p) {
    setError("");
    setOk("");
    const [linea1, linea2] = partirNombre(p.name);
    setTextos((t) => ({
      ...t,
      linea1,
      linea2,
      precio: p.desde != null ? formatearPrecio(p.desde) : "",
    }));
    setFuente({
      tipo: "producto",
      id: p.id,
      url: p.portada,
      encuadre: p.encuadre,
      foto: p.fotoPortada,
      nombre: p.name,
    });
  }

  const cambiarTexto = (campo, valor) => {
    setOk("");
    setTextos((t) => ({ ...t, [campo]: valor }));
  };

  const nombreArchivo = () =>
    `amoma-${slugify(`${textos.linea1} ${textos.linea2}`) || "publicacion"}-${formato}.jpg`;

  const armarArchivo = () =>
    new Promise((ok, mal) =>
      canvasRef.current.toBlob(
        (b) =>
          b
            ? ok(new File([b], nombreArchivo(), { type: "image/jpeg" }))
            : mal(new Error("No se pudo armar la imagen.")),
        "image/jpeg",
        0.92,
      ),
    );

  // si marcó "Sumar también a la galería": la foto original (sin textos)
  const sumarSiCorresponde = async () => {
    if (!aGaleria || !fuente) return "";
    if (fuente.tipo === "archivo") {
      await agregarFotoGaleria(
        fuente.archivo,
        `${textos.linea1} ${textos.linea2}`.trim() || "Torta de Amoma",
        Date.now() % 1e9,
      );
      setFuente({ ...fuente, enGaleria: true });
      return " La foto se sumó a la galería.";
    }
    const ya = !(await sumarAGaleria(fuente.foto, fuente.nombre));
    return ya
      ? " La foto ya estaba en la galería."
      : " La foto se sumó a la galería.";
  };

  const descargar = async () => {
    setError("");
    setOk("");
    setTrabajando(true);
    try {
      const archivo = await armarArchivo();
      const url = URL.createObjectURL(archivo);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      const extra = await sumarSiCorresponde();
      setOk(`Imagen descargada ✓ Subila a Instagram desde tu galería.${extra}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  const puedeCompartir =
    typeof navigator !== "undefined" && Boolean(navigator.canShare);
  const compartir = async () => {
    setError("");
    setOk("");
    try {
      const archivo = await armarArchivo();
      if (!navigator.canShare({ files: [archivo] }))
        return setError("Este celular no deja compartir. Usá “Descargar”.");
      await navigator.share({ files: [archivo] });
      const extra = await sumarSiCorresponde();
      if (extra) setOk(extra.trim());
    } catch (e) {
      if (e.name !== "AbortError")
        setError("No se pudo compartir. Usá “Descargar”.");
    }
  };

  const fotoLista = Boolean(foto);
  const fotoDeArchivoYaEnGaleria =
    fuente?.tipo === "archivo" && fuente.enGaleria;

  return (
    <>
      <h1 className="adm-titulo">
        Crear <em>publicación</em>
      </h1>

      <div className="adm-pub">
        <div className="adm-pub__vista">
          <p className="adm-pub__paso">1. Elegí la foto</p>
          <ul className="adm-pub__fotos">
            <li>
              <button
                type="button"
                className="adm-pub__foto adm-pub__foto--otra"
                onClick={() => setEligiendo(true)}
              >
                <span aria-hidden="true">+</span>
                Otra foto
              </button>
            </li>
            {productos?.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="adm-pub__foto"
                  aria-pressed={
                    fuente?.tipo === "producto" && fuente.id === p.id
                  }
                  onClick={() => elegirProducto(p)}
                >
                  <img src={p.portada} alt="" />
                  {p.name}
                </button>
              </li>
            ))}
          </ul>

          <div
            className={`adm-pub__lienzo adm-pub__lienzo--${formato}`}
            aria-busy={!fotoLista}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`Vista previa: ${textos.linea1} ${textos.linea2}`}
            />
            {!fotoLista && fuente && (
              <span className="adm-pub__cargando">Cargando la foto…</span>
            )}
          </div>
        </div>

        <div className="adm-pub__opciones">
          <p className="adm-pub__paso">2. Elegí cómo se ve</p>
          <fieldset className="adm-modelos">
            <legend>Modelo</legend>
            {MODELOS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={modelo === m.id}
                onClick={() => setModelo(m.id)}
              >
                <canvas
                  ref={(el) => (miniRefs.current[m.id] = el)}
                  aria-hidden="true"
                />
                <span>{m.nombre}</span>
              </button>
            ))}
          </fieldset>
          <Opciones
            titulo="Color"
            valor={color}
            onCambio={setColor}
            opciones={[
              { id: "crema", nombre: "Crema" },
              { id: "chocolate", nombre: "Chocolate" },
            ]}
          />
          <Opciones
            titulo="Formato"
            valor={formato}
            onCambio={setFormato}
            opciones={[
              { id: "cuadrado", nombre: "Cuadrado (feed)" },
              { id: "historia", nombre: "Historia" },
            ]}
          />

          <p className="adm-pub__paso">3. Revisá el texto</p>
          <div className="adm-pub__textos">
            <div className="campo">
              <label htmlFor="pub-l1">Primer renglón</label>
              <input
                id="pub-l1"
                maxLength={40}
                value={textos.linea1}
                onChange={(e) => cambiarTexto("linea1", e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="pub-l2">
                Segundo renglón <small>(va en cursiva rosa)</small>
              </label>
              <input
                id="pub-l2"
                maxLength={40}
                value={textos.linea2}
                onChange={(e) => cambiarTexto("linea2", e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="pub-precio">
                Precio <small>(vacío = sin precio)</small>
              </label>
              <input
                id="pub-precio"
                maxLength={24}
                value={textos.precio}
                onChange={(e) => cambiarTexto("precio", e.target.value)}
              />
            </div>
            <label className="adm-check">
              <input
                type="checkbox"
                checked={textos.desde}
                onChange={(e) => cambiarTexto("desde", e.target.checked)}
              />
              Poner “desde” antes del precio
            </label>
          </div>

          <label className="adm-check">
            <input
              type="checkbox"
              checked={aGaleria}
              disabled={fotoDeArchivoYaEnGaleria}
              onChange={(e) => setAGaleria(e.target.checked)}
            />
            Sumar también la foto a la galería de la página
          </label>

          {error && (
            <p className="adm-error" role="alert">
              {error}
            </p>
          )}
          {ok && (
            <p className="adm-ok" role="status">
              {ok}
            </p>
          )}
          <div className="adm-pub__acciones">
            <button
              type="button"
              className="btn btn--rosa"
              disabled={!fotoLista || trabajando}
              onClick={descargar}
            >
              <Icono nombre="descargar" width={18} height={18} />{" "}
              {trabajando ? "Preparando…" : "Descargar imagen"}
            </button>
            {puedeCompartir && (
              <button
                type="button"
                className="btn btn--borde"
                disabled={!fotoLista || trabajando}
                onClick={compartir}
              >
                <Icono nombre="compartir" width={18} height={18} /> Compartir
              </button>
            )}
          </div>
        </div>
      </div>

      {eligiendo && (
        <ElegirFoto
          titulo="Foto para la publicación"
          textoSubir="Usar una foto del celular"
          onCerrar={() => setEligiendo(false)}
          onArchivo={(archivo) => {
            setEligiendo(false);
            setOk("");
            setFuente({ tipo: "archivo", archivo });
          }}
          onElegir={(f) => {
            setEligiendo(false);
            setOk("");
            setFuente({
              tipo: "cargada",
              url: f.url,
              foto: f,
              nombre: f.etiqueta,
            });
          }}
        />
      )}
    </>
  );
}

export default Publicar;
