# 13 · Efectos premium (recetario para copiar en cualquier rubro)

Los efectos que al cliente le encantaron en Amoma, **con su nombre, qué se siente, cómo está hecho
y dónde está el código**. Sirven igual para una pastelería, un gimnasio, un estudio o una tienda:
cambian las fotos y los colores, no la técnica.

> Regla de oro: el efecto acompaña, no distrae. Todo es suave (0.4 a 1.2 s), usa la misma curva
> (`cubic-bezier(.22,1,.36,1)`: arranca rápido y frena despacio, "como algo con peso") y se apaga
> si la persona activó "reducir movimiento" en su teléfono.

---

## A. Al bajar con el dedo (scroll)

### 1. Aparición suave ("reveal")

- **Qué se siente**: cada bloque entra subiendo apenas y aclarándose cuando llega a la pantalla, como
  si se acomodara solo.
- **Cómo**: `IntersectionObserver` agrega la clase `is-visible` cuando el elemento asoma (10 % antes
  del borde). CSS: de `opacity 0 + translateY(28px)` a normal en **0.9 s**. Se puede escalonar con
  `delay` (ej. 120 ms entre los pasos 01, 02, 03).
- **Código**: `src/components/Reveal.jsx` + `.reveal` en `src/index.css`.

### 2. Títulos palabra por palabra

- **Qué se siente**: el título se "escribe" subiendo cada palabra detrás de una cortina invisible.
- **Cómo**: cada palabra va dentro de un `span` con `overflow: hidden`; la palabra arranca abajo y
  sube. Cada una 65 ms después de la anterior.
- **Código**: `src/components/Palabras.jsx` + `.palabra` en `src/index.css`.

### 3. Fotos que se descubren

- **Qué se siente**: la foto se destapa de abajo hacia arriba mientras se aleja un poquito (zoom out),
  como un telón.
- **Cómo**: `clip-path: inset(100% 0 0 0)` → `inset(0)` en **1.2 s**, y la imagen pasa de
  `scale(1.18)` a `1` en 1.6 s. En tarjetas redondeadas: `inset(... round 2rem)` para que el
  recorte también sea redondo.
- **Código**: clase `.descubrir` en `src/index.css` (portada, categorías, galería).

### 4. Tarjetas que aparecen en cascada

- **Qué se siente**: las tarjetas del catálogo entran una detrás de otra, agrandándose apenas.
- **Cómo**: `animation: sabor-in 0.6s` con `animation-delay: calc(var(--i) * 60ms)` (`--i` = número de
  tarjeta).
- **Código**: `.sabor` en `src/styles/Catalog.css`.

### 5. Parallax sutil de fotos

- **Qué se siente**: dentro de la tarjeta, la foto se mueve un poco más lento que la página: da
  profundidad.
- **Cómo**: CSS puro, sin JavaScript: `animation-timeline: view()` mueve la foto de -6 % a +6 %.
  Solo en navegadores que lo soportan (en los demás no pasa nada malo).
- **Código**: final de `src/styles/Categories.css`.

### 6. Hojas superpuestas

- **Qué se siente**: cada sección se apoya sobre la anterior como una hoja de papel, con esquinas
  redondeadas y sombra suave. El cambio de color entre secciones queda intencional, no un corte.
- **Cómo**: `border-radius: 2rem 2rem 0 0`, margen negativo hacia arriba y sombra. **No usar
  degradés entre secciones**: se ven como mancha.
- **Código**: `.catalogo`, `.personalizada`, `.cierre`.

### 7. Menú que se esconde al bajar

- **Qué se siente**: más pantalla para el contenido; el menú vuelve apenas subís.
- **Código**: `src/components/Navbar.jsx`.

---

## B. Celular: deslizar tarjetas de costado (el efecto favorito del cliente)

### 8. Carrusel con "tarjeta al frente"

- **Qué se siente**: deslizás con el dedo y la tarjeta que queda en el centro **crece y se ilumina**
  (y su foto hace un zoom suave). Las demás quedan un poco más chicas y apagadas, esperando. Al soltar,
  la tarjeta "se acomoda" sola en su lugar.
- **Cómo**:
  - `scroll-snap-type: x mandatory` + `scroll-snap-align: start`: el navegador frena la tarjeta justo
    en su lugar (eso es lo que se siente como "se formó sola").
  - Un listener de scroll (dentro de `requestAnimationFrame`, para no trabar) calcula qué tarjeta está
    al frente y le pone la clase `is-centrada`.
  - CSS: las de atrás `scale(.86)` y `opacity .75`; la del frente `scale(1)` y la foto
    `scale(1.09)`, con transiciones de 0.6 a 1.1 s.
  - Tarjetas de `min(80vw, 22rem)` de ancho: siempre **asoma la siguiente**, invita a deslizar.
  - Lugar extra arriba y abajo (`padding-block` + margen negativo) para que la tarjeta que crece y su
    sombra **no se corten** en línea recta.
- **Código**: `src/sections/Categories.jsx` (efecto `alDeslizar`) + `src/styles/Categories.css`.

### 9. Fondo ambiental

- **Qué se siente**: toda la sección cambia de color según la tarjeta que está al frente (rosa,
  chocolate, verde…), en 0.9 s. Parece que la página "respira" con la foto.
- **Cómo**: cada categoría tiene su `tono` (`fondo`, `texto`, `acento`) y se pasa como variables CSS
  (`--amb-fondo`…) al contenedor. En celular la sección ocupa **toda la pantalla** (`min-height:
100svh`) para que el color la cubra entera.
- **Código**: `tono` en `src/data/catalog.js`, `Categories.jsx`, `.categorias` en `Categories.css`.

### 10. Portal: entrar a la tarjeta

- **Qué se siente**: tocás la tarjeta y se **expande a pantalla completa**, se lee el nombre un
  instante y "se abre" mostrando el catálogo ya filtrado.
- **Cómo**: View Transitions (`document.startViewTransition`). Antes, se **precarga** la foto grande
  (si no, hay un parpadeo blanco). Celular: pantalla completa + pausa de 420 ms para leer. Compu:
  tarjeta grande redondeada, sin pausa (el cliente lo prefirió así).
- **Código**: `abrirCategoria` en `src/sections/Categories.jsx`. Errores y arreglos: ver
  `11-lecciones-amoma.md`.

---

## C. Compu: el mismo lenguaje, otra coreografía

En compu **no se copia el celular más grande**: se diseña aparte, con el mismo estilo.

### 11. Grilla editorial "una arriba, una abajo"

- **Qué se siente**: las 4 tarjetas en fila, alternando altura (la 2.ª y la 4.ª bajan 4rem): ritmo de
  revista.
- **Código**: `@media (min-width: 64rem)` en `Categories.css` (`.categoria:nth-child(even)`).

### 12. Pasar el mouse = protagonismo

- **Qué se siente**: la tarjeta bajo el mouse sube y crece (`translateY(-8px) scale(1.06)`), su foto se
  acerca, la flecha "Ver" se corre 5 px; las demás se achican (`.96`), se apagan (`opacity .5`) y
  pierden color. El fondo ambiental funciona igual que en celu.
- **Sombra que respeta la forma**: `filter: drop-shadow(...)` en el contenedor (no `box-shadow`), así
  la sombra sigue la tarjeta redondeada aunque crezca.
- **Código**: `.is-activa` y `.categorias--activa` en `Categories.css`.

### 13. Tarjetas del catálogo que flotan

- Hover: la tarjeta sube 6 px y la foto redonda gira apenas y crece (`scale(1.06) rotate(-4deg)`), con
  un rebote suave. Solo con `@media (hover: hover)` (en celu no hay mouse y quedaría "pegado").
- **Código**: `.sabor__btn:hover` en `Catalog.css`.

---

## D. Al tocar / abrir

### 14. La foto viaja al detalle

- **Qué se siente**: tocás una torta y su foto **vuela y se agranda** hasta el panel de detalle; al
  cerrar, vuelve a su lugar.
- **Cómo**: View Transitions con `view-transition-name` puesto **solo durante** la transición (si
  queda puesto, se ven otras fotos encima). Coreografía propia, sin fundido de página.
- **Código**: `abrir/cerrar` en `Catalog.jsx`, `src/lib/transicion.js`.

### 15. Filtros que reacomodan

- Las tarjetas se **deslizan** a su nuevo lugar al cambiar de filtro (View Transitions con un nombre
  por tarjeta, solo mientras se filtra). **Código**: `elegirFiltro` en `Catalog.jsx`.

### 16. Hoja desde abajo + fondo quieto

- Detalle, pedido y menú suben como una hoja desde abajo, con el fondo desenfocado. Mientras están
  abiertos, la página de atrás **no se mueve** (`html:has(dialog[open]) { overflow: hidden }`).

### 17. Respuesta al tocar

- Botones que se hunden al tocar (`scale(.97)`), pastilla "Tu pedido" que **salta** al agregar algo,
  botón que pasa a "✓ Agregado" en verde. Son detalles chicos que hacen que todo se sienta vivo.

---

## E. Siempre vivos (con medida)

- **Bienvenida tipo telón**: logo + frase, el telón sube con borde curvo (`public/splash.*`). Una vez
  por visita.
- **Sello con texto girando** + corazón que late (portada).
- **Ilustración que se arma sola** (torta SVG que cae capa por capa con peso y rebote).
- Regla: las animaciones en loop **solo mientras se ven** y nunca más de una o dos por pantalla.

---

## F. Proporciones (por qué se ve "justo" en el celular)

| Sección    | Celular (390 px)                                                                            | Compu (1366 px)                            |
| ---------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Portada    | foto arriba (proporción 5:5.6), título grande `clamp(2.6rem, 8vw, 5.4rem)`, 1 botón         | dos columnas (1.1 / 0.9), alto de pantalla |
| Categorías | **pantalla completa**, carrusel con tarjetas al 80 % del ancho (asoma la siguiente)         | 4 tarjetas en fila, alternadas             |
| Catálogo   | 2 columnas, fotos redondas; la sección ocupa al menos toda la pantalla                      | 3 o 4 columnas                             |
| Detalle    | hoja desde abajo que **entra sin scroll** (probado en 320 px y iPhone SE)                   | ventana centrada                           |
| Espaciado  | márgenes `clamp(1rem, 4vw, 2.5rem)`, separación entre secciones `clamp(4.5rem, 12vw, 9rem)` | crecen solos con la pantalla               |

Claves: **un propósito y un botón principal por sección**; que en celular cada sección "llene" la
pantalla sin mostrar la siguiente cortada; tocar cosas de **al menos 44 px**.

---

## G. Cómo llevarlo a otro rubro (ejemplo: gimnasio)

| Efecto de Amoma                          | En un gimnasio                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Carrusel de categorías + fondo ambiental | Carrusel de **disciplinas** (funcional, spinning, yoga): el fondo toma el color de cada una |
| Portal a la categoría                    | Tocar "Spinning" se expande y abre los **horarios** de esa clase                            |
| Foto que viaja al detalle                | Foto del profe/clase que se agranda a su ficha                                              |
| Pedido de varios productos               | Armar **plan**: clases + suplementos, y mandarlo por WhatsApp                               |
| Ilustración que se arma                  | Contador/anillo de progreso que se completa                                                 |
| Bienvenida tipo telón                    | Logo + frase de marca, una vez por visita                                                   |

Siempre: fotos **reales** del lugar, misma curva y duraciones, y revisar en 390 y 1366 px.

---

## H. Cómo pedírselo al Claude del futuro

> "Usá los efectos de `docs/playbook/13-efectos-premium.md` de Amoma: aparición suave, títulos palabra
> por palabra, fotos que se descubren, carrusel con tarjeta al frente + fondo ambiental en celu,
> grilla editorial con hover en compu, portal a la categoría y foto que viaja al detalle."
