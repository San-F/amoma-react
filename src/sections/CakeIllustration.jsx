// Ilustración de la torta que se arma. SVG puro: pesa casi nada y se ve
// nítido en cualquier pantalla. Cada vez que cambia una elección, su capa
// se vuelve a montar (key) y repite la animación de "caer".

const CX = 180; // centro horizontal
const RX = 110; // radio horizontal de la torta
const RY = 22; // "perspectiva" (radio vertical de las elipses)
const BASE = 292; // borde inferior de la torta
const ESPONJA = 46;
const RELLENO = 14;

// Capas de abajo hacia arriba
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
}); // de abajo hacia arriba: cada capa tapa la cara superior de la anterior
const TOPE = y; // y de la cara superior

const cilindro = (top, h, rx = RX) =>
  `M${CX - rx},${top} L${CX - rx},${top + h} A${rx},${RY} 0 0 0 ${CX + rx},${top + h} L${CX + rx},${top} Z`;

// borde inferior ondulado de la cobertura (chorreado)
function pathCobertura(largo) {
  const rx = RX + 3;
  const puntos = [];
  const gotas = [
    [-0.85, 1.0],
    [-0.55, 1.6],
    [-0.2, 0.8],
    [0.15, 1.9],
    [0.45, 1.1],
    [0.78, 1.5],
  ];
  for (let x = -rx; x <= rx; x += 3) {
    const t = x / rx;
    const curva = RY * Math.sqrt(Math.max(0, 1 - t * t));
    const gota = gotas.reduce(
      (acc, [c, k]) => acc + k * Math.exp(-((t - c) ** 2) / 0.004),
      0,
    );
    puntos.push(
      `${(CX + x).toFixed(1)},${(TOPE + 14 + curva + gota * largo).toFixed(1)}`,
    );
  }
  return `M${CX - rx},${TOPE} L${puntos.join(" L")} L${CX + rx},${TOPE} Z`;
}

// posiciones sobre la cara superior, ordenadas de atrás hacia adelante
const ANILLO = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  return { x: CX + Math.cos(a) * 78, y: TOPE + Math.sin(a) * 13, i };
}).sort((p, q) => p.y - q.y);

function Decoracion({ tipo, cobertura }) {
  if (tipo === "frutos-rojos") {
    return ANILLO.map((p, n) => (
      <g key={n} className="deco" style={{ "--i": n }}>
        {n % 2 === 0 ? (
          <>
            <path
              d={`M${p.x - 9},${p.y - 6} Q${p.x},${p.y + 16} ${p.x + 9},${p.y - 6} Q${p.x},${p.y - 12} ${p.x - 9},${p.y - 6}Z`}
              fill="#D7263D"
            />
            <path
              d={`M${p.x - 6},${p.y - 8} L${p.x},${p.y - 4} L${p.x + 6},${p.y - 8}`}
              stroke="#4F8A3A"
              strokeWidth="3"
              fill="none"
            />
          </>
        ) : (
          <circle cx={p.x} cy={p.y - 3} r="6" fill="#3D3F7A" />
        )}
      </g>
    ));
  }
  if (tipo === "rosetas") {
    const color = cobertura?.id === "ganache" ? "#FFF9F1" : "#F6C1D0";
    return ANILLO.map((p, n) => (
      <g key={n} className="deco" style={{ "--i": n }}>
        <circle cx={p.x} cy={p.y - 6} r="11" fill={color} stroke="#00000014" />
        <circle
          cx={p.x}
          cy={p.y - 7}
          r="6.5"
          fill="none"
          stroke="#00000018"
          strokeWidth="2"
        />
        <circle cx={p.x} cy={p.y - 8} r="2.5" fill="#00000012" />
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
      const r = 20 + ((n * 37) % 70);
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

function CakeIllustration({ eleccion, descripcion }) {
  const { bizcochuelo, relleno, cobertura, decoracion } = eleccion;

  return (
    <svg
      className="torta-svg"
      viewBox="0 0 360 340"
      role="img"
      aria-label={descripcion}
    >
      <defs>
        {/* volumen: luz a la izquierda, sombra a la derecha */}
        <linearGradient id="volumen" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* plato */}
      <ellipse cx={CX} cy={BASE + 10} rx="152" ry="30" fill="#E9DED2" />
      <ellipse cx={CX} cy={BASE + 4} rx="150" ry="28" fill="#FFFFFF" />

      {/* contorno punteado mientras no hay bizcochuelo */}
      {!bizcochuelo && (
        <g className="torta-fantasma">
          <path d={cilindro(TOPE, BASE - TOPE)} />
          <ellipse cx={CX} cy={TOPE} rx={RX} ry={RY} />
        </g>
      )}

      {bizcochuelo && (
        <g key={bizcochuelo.id}>
          {GEOMETRIA.map((c, n) => {
            const esRelleno = c.tipo === "relleno";
            const color = esRelleno
              ? (relleno?.color ?? "#EFE3D3")
              : bizcochuelo.color;
            return (
              <g
                key={`${n}-${esRelleno ? relleno?.id : ""}`}
                className={
                  esRelleno
                    ? relleno
                      ? "capa capa--relleno"
                      : "capa"
                    : "capa capa--cae"
                }
                style={{ "--i": n }}
              >
                <path d={cilindro(c.top, c.h)} fill={color} />
                <path d={cilindro(c.top, c.h)} fill="url(#volumen)" />
                <ellipse
                  cx={CX}
                  cy={c.top}
                  rx={RX}
                  ry={RY}
                  fill={esRelleno ? color : bizcochuelo.sombra}
                />
              </g>
            );
          })}
        </g>
      )}

      {cobertura && bizcochuelo && (
        <g key={cobertura.id} className="capa capa--cobertura">
          <path
            d={pathCobertura(cobertura.id === "ganache" ? 34 : 18)}
            fill={cobertura.color}
          />
          <path
            d={pathCobertura(cobertura.id === "ganache" ? 34 : 18)}
            fill="url(#volumen)"
          />
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
        </g>
      )}

      {decoracion && bizcochuelo && (
        <g key={`${decoracion.id}-${cobertura?.id}`}>
          <Decoracion tipo={decoracion.id} cobertura={cobertura} />
        </g>
      )}
    </svg>
  );
}

export default CakeIllustration;
