# Amoma — Dirección de diseño

Decisión tomada antes de la Etapa 4 para que todo el trabajo visual siga una sola línea.

## Concepto: "casero con personalidad"

Un punto medio entre dos referencias:

- **Boba Ice Cream** (Site of the Day en Awwwards, estudio Synchronized): personalidad fuerte, colores
  saturados, tienda que se siente parte de la experiencia, mucha microinteracción.
- **Ladurée / Dominique Ansel / Magnolia Bakery / Milk Bar**: el producto como protagonista, fotografía
  impecable, mucho aire.

Amoma no es una marca fría y francesa ni una marca estridente: es **"casero y hecho con amor"**.
Lo premium sale de la **coherencia** (lo que hace bien Lucciano's) + **un momento memorable** (el hero 3D) +
**detalles cuidados** (microinteracciones), no de llenar todo de efectos.

## Identidad

| Token          | Valor (inicial) | Uso                              |
| -------------- | --------------- | -------------------------------- |
| `--crema`      | `#FBF5EE`       | Fondo principal                  |
| `--cacao`      | `#3B2420`       | Texto, fondos oscuros            |
| `--rosa-amoma` | `#E76F92`       | Acento de marca (el rosa actual) |
| `--pistacho`   | `#A8C686`       | Acento secundario, etiquetas     |
| `--dulce`      | `#C98A4B`       | Detalles (dulce de leche)        |

- **Display:** _Fraunces_ (serif variable con ejes "soft" y "wonk": elegante pero con carácter casero).
- **Texto:** _Manrope_.
- **Logo:** se mantiene _Pacifico_ solo en el logotipo.
- Todas auto-alojadas (sin pedidos a Google).

## Home (v2, después del feedback)

Recorrido pensado para quien llega desde Instagram con el celular:

1. **Portada** — fondo crema, foto real de las dos tortas en arco + sello "hecho con amor"
   (la elegida por la clienta). Botones: "Ver tortas" y "Pedir por WhatsApp".
2. **Cinta editorial** — franja oscura con palabras que pasan lento (separador, da ritmo).
3. **Elegí por dónde empezar** — las 3 fotos de calidad (Tortas, Postres individuales,
   Personalizadas) con numeración 01/02/03 y parallax sutil; cada una lleva a su parte.
4. **Nuestras tortas** (estilo Lucciano's) — tarjetas de color con la torta sola en un círculo.
   Al tocar, la foto "viaja" y se agranda (View Transitions) y se abre el detalle con tamaños
   y "Pedir por WhatsApp" con el producto y el tamaño ya escritos. Filtros por tipo.
5. **Tu torta, a tu manera** — animación que arma tortas sola (capa por capa, en loop, solo
   cuando está en pantalla) + campo para escribir la idea → WhatsApp + 3 temáticas reales.
6. **Cómo pedir** — 3 pasos (Elegí · Escribinos · Coordinamos) en franja oscura + CTAs.

Descartado: el armador interactivo paso a paso (más fricción que valor; lo personalizado
se resuelve mejor conversando por WhatsApp).

## Celular primero

- Se diseña primero a 375 px de ancho y después se agranda.
- Zonas táctiles de 44 px mínimo; el botón principal al alcance del pulgar.
- Gestos naturales (deslizar), sin depender de "hover".
- El 3D solo se carga en dispositivos que lo soportan bien; si no, la versión ilustrada.

## Reglas (qué NO hacer)

- Nada de cursor personalizado ni efectos de mouse en celular.
- No secuestrar el scroll en celular (el scroll suave es solo una mejora en desktop).
- Sin video pesado ni sonido automático en el hero.
- Sin reseñas inventadas: solo testimonios reales o capturas de Instagram con permiso.
- Respetar siempre `prefers-reduced-motion`.

## Presupuesto de rendimiento

- 3D cargado aparte y en diferido; la página es usable antes de que aparezca.
- LCP < 2,5 s en celular 4G; Lighthouse ≥ 90.
- Fotos en AVIF/WebP con varios tamaños.

## Stack visual

GSAP + ScrollTrigger (animaciones), Lenis (scroll suave en desktop), React Three Fiber + drei (3D),
View Transitions API (transiciones).
