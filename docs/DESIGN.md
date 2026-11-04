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

## Momentos clave

1. **Hero: la torta se arma.** Torta 3D estilizada hecha en código (Three.js / React Three Fiber), sin
   necesidad de un modelo comprado: al scrollear bajan las capas (bizcochuelo → dulce de leche → crema →
   frutos rojos) y se cuenta "cómo la hacemos". Gira suave con el mouse. Gratis y propia.
   Respaldo: imagen estática en celulares de gama baja y con "reducir movimiento".
2. **Productos que flotan.** Fotos reales recortadas sin fondo (con herramienta libre, p. ej. `rembg`) sobre
   tarjetas de color por categoría; inclinación 3D sutil al pasar el mouse; entrada escalonada con el scroll.
3. **Pedido como experiencia** (la "tienda que no parece tienda"): elegís producto → tamaño → sabor → fecha,
   se arma "Tu pedido" en un panel animado y sale por WhatsApp con el mensaje listo.
4. **Cinta de sabores** en movimiento continuo entre secciones.
5. **Galería** con scroll horizontal y transición fluida al abrir una foto (View Transitions).
6. **Microinteracciones:** botones magnéticos, cursor personalizado (solo desktop), subrayados animados,
   transiciones entre páginas.

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
