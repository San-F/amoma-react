// Torta ilustrada que se arma sola. SVG puro (liviano y nítido en cualquier
// pantalla). Cada capa nueva se monta con su propia "key", así su animación
// CSS arranca de nuevo: cae con peso (se aplasta y rebota), el relleno se
// esparce, la cobertura chorrea, cae la decoración y se prende la velita.

const CX = 180; // centro horizontal
const RX = 104; // radio horizontal de la torta
const RY = 21; // "perspectiva": radio vertical de las elipses
const BASE = 262; // borde inferior de la torta (apoyada en el pie)
const ESPONJA = 42;
const RELLENO = 13;

// capas de abajo hacia arriba
const CAPAS = [
  { tipo: "esponja", h: ESPONJA },
  { tipo: "relleno", h: RELLENO },
  { tipo: "esponja", h: ESPONJA },
  { tipo: "relleno", h: RELLENO },
  { tipo: "esponja", h: ESPONJA },
];

let y = BASE;
const GEOMETRIA = CAPAS.map((c) => {
  y -= c.h;
  return { ...c, top: y };
});
const TOPE = y; // altura de la cara superior

const cilindro = (top, h, rx = RX) =>
  `M${CX - rx},${top} L${CX - rx},${top + h} A${rx},${RY} 0 0 0 ${CX + rx},${top + h} L${CX + rx},${top} Z`;

// borde del relleno: un poco ondulado, como crema que asoma
function pathRelleno(top, h) {
  const rx = RX + 3;
  const pts = [];
  for (let x = -rx; x <= rx; x += 4) {
    const t = x / rx;
    const curva = RY * Math.sqrt(Math.max(0, 1 - t * t));
    const onda = Math.sin(x * 0.35) * 1.6;
    pts.push(`${(CX + x).toFixed(1)},${(top + h + curva + onda).toFixed(1)}`);
  }
  return `M${CX - rx},${top} L${pts.join(" L")} L${CX + rx},${top} Z`;
}

// cuerpo de la cobertura con chorreados (cada gota con su largo)
const GOTAS = [
  [-0.88, 0.9],
  [-0.62, 1.5],
  [-0.33, 0.7],
  [-0.05, 1.8],
  [0.24, 1.0],
  [0.5, 1.6],
  [0.78, 1.1],
];
function pathCobertura(largo) {
  const rx = RX + 3;
  const pts = [];
  for (let x = -rx; x <= rx; x += 2.5) {
    const t = x / rx;
    const curva = RY * Math.sqrt(Math.max(0, 1 - t * t));
    const gota = GOTAS.reduce(
      (acc, [c, k]) => acc + k * Math.exp(-((t - c) ** 2) / 0.0035),
      0,
    );
    pts.push(
      `${(CX + x).toFixed(1)},${(TOPE + 12 + curva + gota * largo).toFixed(1)}`,
    );
  }
  return `M${CX - rx},${TOPE} L${pts.join(" L")} L${CX + rx},${TOPE} Z`;
}

// puntos sobre la cara superior, ordenados de atrás hacia adelante
const ANILLO = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  return { x: CX + Math.cos(a) * 74, y: TOPE + Math.sin(a) * 12.5, i };
}).sort((p, q) => p.y - q.y);

// destellos alrededor de la torta terminada
const DESTELLOS = [
  [62, 96, 1],
  [300, 84, 0.8],
  [44, 196, 0.7],
  [318, 170, 1.1],
  [250, 40, 0.6],
];

function Destello({ x, y, s, i }) {
  return (
    <path
      className="destello"
      style={{ "--i": i }}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z"
      fill="#F2C14E"
    />
  );
}

// nube de azúcar cuando una capa aterriza
function Nube({ y: yNube }) {
  return (
    <g className="nube" aria-hidden="true">
      {[-1, 1].flatMap((lado) =>
        [0, 1, 2].map((k) => (
          <circle
            key={`${lado}${k}`}
            className="nube__punto"
            style={{
              "--dx": `${lado * (18 + k * 10)}px`,
              "--dy": `${-6 - k * 5}px`,
              "--i": k,
            }}
            cx={CX + lado * (RX - 6)}
            cy={yNube}
            r={3.5 - k * 0.8}
            fill="#FFFFFF"
          />
        )),
      )}
    </g>
  );
}

function Decoracion({ tipo, cobertura }) {
  if (tipo === "frutos-rojos") {
    return ANILLO.map((p, n) => (
      <g key={n} className="deco" style={{ "--i": n }}>
        {n % 2 === 0 ? (
          <>
            <path
              d={`M${p.x - 9},${p.y - 7} Q${p.x},${p.y + 15} ${p.x + 9},${p.y - 7} Q${p.x},${p.y - 13} ${p.x - 9},${p.y - 7}Z`}
              fill="#D7263D"
            />
            <circle
              cx={p.x - 3}
              cy={p.y - 3}
              r="1.6"
              fill="#FFFFFF"
              opacity="0.5"
            />
            <path
              d={`M${p.x - 6},${p.y - 9} L${p.x},${p.y - 5} L${p.x + 6},${p.y - 9}`}
              stroke="#4F8A3A"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            <circle cx={p.x} cy={p.y - 4} r="6" fill="#3D3F7A" />
            <circle
              cx={p.x - 2}
              cy={p.y - 6}
              r="1.6"
              fill="#FFFFFF"
              opacity="0.45"
            />
          </>
        )}
      </g>
    ));
  }
  if (tipo === "rosetas") {
    const color = cobertura?.id === "ganache" ? "#FFF9F1" : "#F6C1D0";
    return ANILLO.map((p, n) => (
      <g key={n} className="deco" style={{ "--i": n }}>
        <circle cx={p.x} cy={p.y - 6} r="11" fill={color} stroke="#00000014" />
        <path
          d={`M${p.x - 6},${p.y - 6} a6,6 0 1,1 6,6 a3.5,3.5 0 1,1 -3.5,-3.5`}
          fill="none"
          stroke="#0000001f"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    ));
  }
  if (tipo === "flores") {
    return ANILLO.filter((_, n) => n % 2 === 0).map((p, n) => (
      <g key={n} className="deco" style={{ "--i": n }}>
        {[0, 72, 144, 216, 288].map((ang) => (
          <ellipse
            key={ang}
            cx={p.x}
            cy={p.y - 13}
            rx="5"
            ry="8"
            fill={n % 2 ? "#F6C1D0" : "#FFFFFF"}
            stroke="#00000012"
            transform={`rotate(${ang} ${p.x} ${p.y - 6})`}
          />
        ))}
        <circle cx={p.x} cy={p.y - 6} r="4" fill="#F1C232" />
      </g>
    ));
  }
  if (tipo === "chocolate") {
    return Array.from({ length: 22 }, (_, n) => {
      const a = n * 2.4;
      const r = 20 + ((n * 37) % 66);
      const x = CX + Math.cos(a) * r;
      const yy = TOPE + Math.sin(a) * r * 0.17;
      return (
        <rect
          key={n}
          className="deco"
          style={{ "--i": n % 8 }}
          x={x}
          y={yy - 2}
          width="9"
          height="3"
          rx="1.5"
          fill={n % 3 ? "#4A281C" : "#6B3B2A"}
          transform={`rotate(${(n * 47) % 180} ${x + 4} ${yy})`}
        />
      );
    });
  }
  return null;
}

function Vela() {
  const x = CX + 6;
  const base = TOPE - 4;
  return (
    <g className="vela">
      <rect
        x={x - 4}
        y={base - 34}
        width="8"
        height="34"
        rx="2"
        fill="#FFF6E8"
        stroke="#E8D9C4"
      />
      {[0, 1, 2, 3].map((k) => (
        <path
          key={k}
          d={`M${x - 4},${base - 30 + k * 9} l8,-5`}
          stroke="#E76F92"
          strokeWidth="2.2"
        />
      ))}
      <line
        x1={x}
        y1={base - 34}
        x2={x}
        y2={base - 39}
        stroke="#3B2420"
        strokeWidth="1.5"
      />
      <g className="llama">
        <ellipse
          cx={x}
          cy={base - 46}
          rx="9"
          ry="13"
          fill="#F2C14E"
          opacity="0.25"
        />
        <path
          d={`M${x},${base - 58} C${x + 6},${base - 49} ${x + 5},${base - 41} ${x},${base - 39} C${x - 5},${base - 41} ${x - 6},${base - 49} ${x},${base - 58}Z`}
          fill="#F4A340"
        />
        <path
          d={`M${x},${base - 50} C${x + 3},${base - 45} ${x + 2},${base - 41} ${x},${base - 40} C${x - 2},${base - 41} ${x - 3},${base - 45} ${x},${base - 50}Z`}
          fill="#FFF3C4"
        />
      </g>
    </g>
  );
}

function CakeIllustration({ eleccion, descripcion, saliendo = false }) {
  const { bizcochuelo, relleno, cobertura, decoracion } = eleccion;
  const terminada = Boolean(decoracion);

  return (
    <svg
      className="torta-svg"
      viewBox="0 0 360 340"
      role="img"
      aria-label={descripcion}
    >
      <defs>
        {/* volumen: luz a la izquierda, sombra a la derecha */}
        <linearGradient id="t-volumen" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        {/* miga del bizcochuelo */}
        <pattern
          id="t-miga"
          width="14"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="0.9" fill="#000" opacity="0.07" />
          <circle cx="10" cy="7" r="0.7" fill="#000" opacity="0.06" />
          <circle cx="8" cy="2" r="0.6" fill="#fff" opacity="0.18" />
        </pattern>
        <linearGradient id="t-pie" x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E9DED2" />
        </linearGradient>
      </defs>

      {/* pie de torta */}
      <g className="pie">
        <path
          d={`M${CX - 26},${BASE + 22} L${CX - 14},${BASE + 58} L${CX + 14},${BASE + 58} L${CX + 26},${BASE + 22} Z`}
          fill="url(#t-pie)"
        />
        <ellipse cx={CX} cy={BASE + 60} rx="52" ry="11" fill="#E4D6C6" />
        <ellipse cx={CX} cy={BASE + 57} rx="52" ry="10" fill="#FFFFFF" />
        <ellipse cx={CX} cy={BASE + 14} rx="146" ry="27" fill="#E2D3C2" />
        <ellipse cx={CX} cy={BASE + 9} rx="146" ry="26" fill="#FFFFFF" />
        <ellipse
          cx={CX}
          cy={BASE + 9}
          rx="146"
          ry="26"
          fill="url(#t-volumen)"
          opacity="0.5"
        />
      </g>

      {/* contorno punteado mientras no hay torta */}
      {!bizcochuelo && (
        <g className="torta-fantasma">
          <path d={cilindro(TOPE, BASE - TOPE)} />
          <ellipse cx={CX} cy={TOPE} rx={RX} ry={RY} />
        </g>
      )}

      <g className={saliendo ? "torta torta--sale" : "torta"}>
        {bizcochuelo && (
          <>
            {/* sombra suave sobre el plato */}
            <ellipse
              className="sombra"
              cx={CX}
              cy={BASE + 4}
              rx={RX + 8}
              ry={RY - 4}
              fill="#3B2420"
              opacity="0.12"
            />
            <g key={bizcochuelo.id}>
              {GEOMETRIA.map((c, n) => {
                const esRelleno = c.tipo === "relleno";
                if (esRelleno) {
                  const color = relleno?.color ?? "#EFE3D3";
                  return (
                    <g
                      key={`${n}-${relleno?.id ?? "vacio"}`}
                      className={
                        relleno ? "capa capa--relleno" : "capa capa--cae"
                      }
                      style={{ "--i": n }}
                    >
                      <path d={pathRelleno(c.top, c.h)} fill={color} />
                      <path
                        d={pathRelleno(c.top, c.h)}
                        fill="url(#t-volumen)"
                      />
                      <ellipse
                        cx={CX}
                        cy={c.top}
                        rx={RX + 3}
                        ry={RY + 0.5}
                        fill={color}
                      />
                    </g>
                  );
                }
                return (
                  <g key={n} className="capa capa--cae" style={{ "--i": n }}>
                    <path d={cilindro(c.top, c.h)} fill={bizcochuelo.color} />
                    <path d={cilindro(c.top, c.h)} fill="url(#t-miga)" />
                    <path d={cilindro(c.top, c.h)} fill="url(#t-volumen)" />
                    <ellipse
                      cx={CX}
                      cy={c.top}
                      rx={RX}
                      ry={RY}
                      fill={bizcochuelo.sombra}
                    />
                    <ellipse
                      cx={CX}
                      cy={c.top}
                      rx={RX}
                      ry={RY}
                      fill="url(#t-miga)"
                    />
                  </g>
                );
              })}
              <Nube y={BASE + 2} />
            </g>
          </>
        )}

        {cobertura && bizcochuelo && (
          <g key={cobertura.id}>
            {/* los chorreados bajan después de que cae la tapa */}
            <g className="chorreado">
              <path
                d={pathCobertura(cobertura.id === "ganache" ? 30 : 17)}
                fill={cobertura.color}
              />
              <path
                d={pathCobertura(cobertura.id === "ganache" ? 30 : 17)}
                fill="url(#t-volumen)"
              />
            </g>
            <g className="capa capa--tapa">
              <ellipse
                cx={CX}
                cy={TOPE}
                rx={RX + 3}
                ry={RY + 1}
                fill={cobertura.sombra}
              />
              <ellipse
                cx={CX}
                cy={TOPE - 1}
                rx={RX}
                ry={RY - 1}
                fill={cobertura.color}
              />
              {/* brillo */}
              <ellipse
                cx={CX - 38}
                cy={TOPE - 6}
                rx="34"
                ry="6"
                fill="#FFFFFF"
                opacity="0.32"
              />
            </g>
          </g>
        )}

        {decoracion && bizcochuelo && (
          <g key={`${decoracion.id}-${cobertura?.id}`}>
            <Decoracion tipo={decoracion.id} cobertura={cobertura} />
            <Vela />
          </g>
        )}
      </g>

      {terminada && !saliendo && (
        <g aria-hidden="true">
          {DESTELLOS.map(([dx, dy, s], i) => (
            <Destello key={i} x={dx} y={dy} s={s} i={i} />
          ))}
        </g>
      )}
    </svg>
  );
}

export default CakeIllustration;
