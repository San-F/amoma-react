import { useId, useMemo, useState } from "react";
import CakeIllustration from "./CakeIllustration";
import Icon from "../components/Icon";
import Reveal from "../components/Reveal";
import { opcionesTorta, tamanos } from "../data/catalog";
import { fechaLegible, fechaMinima, linkWhatsApp } from "../lib/whatsapp";
import "../styles/CakeBuilder.css";

const PASOS = ["bizcochuelo", "relleno", "cobertura", "decoracion", "pedido"];
const ETIQUETA_PASO = {
  bizcochuelo: "Bizcochuelo",
  relleno: "Relleno",
  cobertura: "Cobertura",
  decoracion: "Decoración",
  pedido: "Tu pedido",
};

function buscar(grupo, id) {
  return opcionesTorta[grupo].opciones.find((o) => o.id === id) ?? null;
}

function CakeBuilder() {
  const uid = useId();
  const [paso, setPaso] = useState(0);
  const [ids, setIds] = useState({});
  const [tamano, setTamano] = useState("mediana");
  const [fecha, setFecha] = useState("");
  const [nota, setNota] = useState("");

  const eleccion = useMemo(
    () => ({
      bizcochuelo: buscar("bizcochuelo", ids.bizcochuelo),
      relleno: buscar("relleno", ids.relleno),
      cobertura: buscar("cobertura", ids.cobertura),
      decoracion: buscar("decoracion", ids.decoracion),
    }),
    [ids],
  );

  const grupo = PASOS[paso];
  const esUltimo = grupo === "pedido";
  const pasoCompleto = esUltimo || Boolean(ids[grupo]);
  const tamanoElegido = tamanos.find((t) => t.id === tamano);

  const descripcion = eleccion.bizcochuelo
    ? `Torta de ${eleccion.bizcochuelo.nombre.toLowerCase()}` +
      (eleccion.relleno
        ? `, relleno de ${eleccion.relleno.nombre.toLowerCase()}`
        : "") +
      (eleccion.cobertura
        ? `, cubierta de ${eleccion.cobertura.nombre.toLowerCase()}`
        : "") +
      (eleccion.decoracion
        ? ` y decorada con ${eleccion.decoracion.nombre.toLowerCase()}`
        : "")
    : "Torta vacía: elegí el bizcochuelo para empezar";

  const mensaje = [
    "¡Hola Amoma! Quiero encargar una torta 🎂",
    "",
    `• Bizcochuelo: ${eleccion.bizcochuelo?.nombre ?? "-"}`,
    `• Relleno: ${eleccion.relleno?.nombre ?? "-"}`,
    `• Cobertura: ${eleccion.cobertura?.nombre ?? "-"}`,
    `• Decoración: ${eleccion.decoracion?.nombre ?? "-"}`,
    `• Tamaño: ${tamanoElegido.nombre} (${tamanoElegido.detalle})`,
    `• Fecha: ${fecha ? fechaLegible(fecha) : "a coordinar"}`,
    nota.trim() ? `• Nota: ${nota.trim()}` : "",
    "",
    "¿Me pasan precio y disponibilidad? ¡Gracias!",
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");

  return (
    <section
      id="arma-tu-torta"
      className="armador seccion"
      aria-labelledby={`${uid}-titulo`}
    >
      <div className="contenedor">
        <Reveal className="armador__intro">
          <p className="eyebrow">Paso a paso</p>
          <h2 id={`${uid}-titulo`}>
            Armá tu <em>torta</em>
          </h2>
          <p className="lead">
            Elegí cada capa y mirala tomar forma. Te respondemos con el precio
            por WhatsApp.
          </p>
        </Reveal>

        <div className="armador__grid">
          <div className="armador__escena">
            <CakeIllustration eleccion={eleccion} descripcion={descripcion} />
          </div>

          <div className="armador__panel">
            <ol className="armador__progreso" aria-label="Pasos">
              {PASOS.map((p, i) => {
                const habilitado =
                  i <= paso ||
                  PASOS.slice(0, i).every((g) => g === "pedido" || ids[g]);
                return (
                  <li key={p}>
                    <button
                      type="button"
                      className={`armador__punto ${i === paso ? "is-actual" : ""} ${i < paso || ids[p] ? "is-hecho" : ""}`}
                      onClick={() => setPaso(i)}
                      disabled={!habilitado}
                      aria-current={i === paso ? "step" : undefined}
                    >
                      <span className="sr-only">
                        Paso {i + 1}: {ETIQUETA_PASO[p]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="armador__paso" key={grupo}>
              {!esUltimo ? (
                <fieldset className="chips">
                  <legend>
                    <span className="armador__num">
                      {paso + 1}/{PASOS.length}
                    </span>
                    {opcionesTorta[grupo].titulo}
                  </legend>
                  <div className="chips__lista">
                    {opcionesTorta[grupo].opciones.map((o) => (
                      <label key={o.id} className="chip">
                        <input
                          type="radio"
                          name={`${uid}-${grupo}`}
                          value={o.id}
                          checked={ids[grupo] === o.id}
                          onChange={() =>
                            setIds((prev) => ({ ...prev, [grupo]: o.id }))
                          }
                        />
                        {o.color && (
                          <span
                            className="chip__color"
                            style={{ "--c": o.color }}
                            aria-hidden="true"
                          />
                        )}
                        {o.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <div className="armador__pedido">
                  <fieldset className="chips">
                    <legend>
                      <span className="armador__num">
                        {PASOS.length}/{PASOS.length}
                      </span>
                      Tamaño
                    </legend>
                    <div className="chips__lista">
                      {tamanos.map((t) => (
                        <label key={t.id} className="chip chip--doble">
                          <input
                            type="radio"
                            name={`${uid}-tamano`}
                            value={t.id}
                            checked={tamano === t.id}
                            onChange={() => setTamano(t.id)}
                          />
                          <span>{t.nombre}</span>
                          <small>{t.detalle}</small>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="campo">
                    <label htmlFor={`${uid}-fecha`}>¿Para cuándo?</label>
                    <input
                      id={`${uid}-fecha`}
                      type="date"
                      min={fechaMinima(2)}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor={`${uid}-nota`}>
                      Algo más <small>(dedicatoria, alergias…)</small>
                    </label>
                    <textarea
                      id={`${uid}-nota`}
                      rows="2"
                      maxLength={300}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                    />
                  </div>

                  <p className="armador__resumen">{descripcion}.</p>
                </div>
              )}
            </div>

            <div className="armador__nav">
              {paso > 0 && (
                <button
                  type="button"
                  className="btn btn--borde"
                  onClick={() => setPaso(paso - 1)}
                >
                  Atrás
                </button>
              )}
              {!esUltimo ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPaso(paso + 1)}
                  disabled={!pasoCompleto}
                >
                  Siguiente
                </button>
              ) : (
                <a
                  className="btn btn--rosa"
                  href={linkWhatsApp(mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="whatsapp" /> Pedir por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CakeBuilder;
