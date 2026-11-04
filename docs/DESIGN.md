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

## Home: pocas secciones, cada una con impacto

Pedido explícito: **poco ruido visual, intuitivo, pensado primero para celular.**
La home tiene **5 secciones**, no más:

1. **Hero** — foto/torta protagonista + frase + un solo botón ("Armá tu torta").
2. **Armá tu torta** ⭐ (el momento interactivo, inspirado en cómo Lucciano's muestra las bochas):
   - Elegís con chips grandes: **bizcochuelo → relleno → cobertura → decoración**.
   - Cada elección hace **caer una capa** sobre la torta con una animación suave (rebote leve),
     como cuando se apila una bocha. La torta es 3D estilizada en desktop y una ilustración
     animada (SVG/capas) en celular: se ve igual de bien y carga instantáneo.
   - Al terminar: tamaño + fecha → **"Pedir por WhatsApp"** con todo el detalle escrito.
   - Los sabores y precios salen de la base (los carga la dueña).
3. **Destacados** — 3 o 4 productos con foto recortada; deslizar con el dedo en celular.
4. **Galería** — trabajos reales; en celular, carrusel a pantalla completa.
5. **Contacto/cierre** — datos, horarios y aviso de agenda.

Microinteracciones solo donde ayudan a entender (botón que responde al tocarlo, capa que cae,
transición al abrir una foto). Nada decorativo que distraiga.

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
