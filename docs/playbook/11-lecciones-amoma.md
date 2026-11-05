# 11 · Lecciones de Amoma (para copiar en el próximo proyecto)

Todo lo que hizo que el front se sintiera **premium**, lo que salió mal y cómo lo arreglamos.
Código de referencia: este mismo repo.

## Recursos premium que funcionaron

| Recurso                              | Qué hace                                                                                                                                                                                                       | Dónde está                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Bienvenida tipo telón**            | Logo + línea + frase; el telón sube con borde curvo y recién ahí arranca la portada. Una vez por visita, nunca en el panel. Archivos propios (CSS/JS) para respetar la CSP. Además tapa el "momento en blanco" | `public/splash.*`, `index.html`                   |
| **Títulos palabra por palabra**      | Cada palabra sube detrás de una "cortina"                                                                                                                                                                      | `src/components/Palabras.jsx`                     |
| **Fotos que se descubren**           | `clip-path` de abajo hacia arriba + zoom out suave                                                                                                                                                             | clase `.descubrir`                                |
| **Fondo ambiental**                  | Al pasar el mouse (compu) o deslizar (celu) por una tarjeta, toda la sección toma el tono de su foto; las otras tarjetas se achican y apagan                                                                   | `Categories.jsx/.css`                             |
| **Portal "entrar a la tarjeta"**     | La tarjeta se expande (View Transitions) y se abre al destino ya filtrado. Celu: pantalla completa + nombre. Compu: tarjeta grande redondeada, sin pausa                                                       | `Categories.jsx`                                  |
| **Foto que viaja al detalle**        | Del catálogo/galería al panel de detalle (View Transitions), con coreografía propia (sin fundido de página)                                                                                                    | `Catalog.jsx`, `Gallery.jsx`, `lib/transicion.js` |
| **Hojas superpuestas**               | Cada sección se apoya sobre la anterior con esquinas redondeadas y sombra suave: el corte entre colores queda intencional                                                                                      | `.catalogo`, `.personalizada`, `.cierre`          |
| **Scroll con aceleración y frenado** | Reemplaza el salto del navegador; se cancela si la persona toca                                                                                                                                                | `src/lib/scroll.js`                               |
| **Animación que se arma sola**       | Torta SVG que cae capa por capa con "peso" (se aplasta y rebota), chorreado, velita                                                                                                                            | `CakeIllustration.jsx`                            |
| **Sello con texto en círculo**       | Texto girando + corazón que late                                                                                                                                                                               | `Hero.jsx`                                        |
| **Menú que se esconde al bajar**     | Vuelve al subir; en celu, velo desenfocado detrás                                                                                                                                                              | `Navbar.jsx`                                      |
| **Etiquetas sutiles**                | "Más pedido / Nuevo / De temporada", editables en el panel                                                                                                                                                     | `products.badge`                                  |
| **Modo demo de precios**             | `?precios=demo` muestra precios inventados para ver el diseño sin engañar a clientes reales                                                                                                                    | `Catalog.jsx`                                     |

## Decisiones de diseño que el cliente validó

- **Fotos reales y consistentes** > cualquier efecto. Nunca fotos con marca de otros (aunque se borre el logo) ni de Pinterest.
- **Pocas secciones, cada una con un propósito**; numeración solo donde hay pasos reales (no en opciones paralelas).
- **Un nombre por cosa** (tarjeta y filtro igual), sin repetir el lema en todos lados.
- El **celular manda**: tarjetas que descansan más chicas y crecen al frente; sección a pantalla completa; detalle que entra sin scroll interno (probado en 320 px y en pantallas bajitas).
- Lo interactivo "paso a paso" (armador de torta) **no gustó**: lo personalizado se resuelve mejor conversando (WhatsApp).
- **Pedido de varios productos sin carrito pesado** (`src/lib/pedido.js`): en el detalle, tamaño + cantidad + total en vivo y **dos botones** ("Agregar y seguir" / "Pedir ahora", que abre la hoja). Hoja con tamaño editable (si se repite, se junta), cantidad, tachito + **Deshacer**, y **un solo WhatsApp**. Lo guardado es solo "qué y cuánto": nombre y precio salen **siempre del catálogo actual** (precio viejo o producto borrado no llegan al mensaje). Probarlo con miles de toques al azar (test "fuzz") además del navegador.
- **Vista previa de WhatsApp**: recorta los costados y a veces deja **solo el cuadrado del centro**. Foto real **entera al centro** (círculo de ~470 px) y **la marca abajo y centrada** (mejor el **logo real** como sello que un texto: se reconoce más; recortar el margen blanco del archivo del logo para que el sello no parezca mal recortado); nada a los costados. Menos de 300 KB. WhatsApp guarda la imagen vieja: al cambiarla, **cambiar el nombre del archivo** (`og-6.jpg`, `og-7.jpg`…). Script: `scripts/og.cjs`. Mostrar 3-4 opciones al cliente antes de publicar.
- **El barrio en el título ayuda a Google** ("Tortas caseras en Villa Pueyrredón, CABA"): búsquedas locales. Si el cliente pide sacarlo por estética, explicarle que perjudica que lo encuentren.
- **Ventana abierta = fondo quieto**: `html:has(dialog[open]) { overflow: hidden }` + `scrollbar-gutter: stable` (sin salto en compu). El cliente lo notó enseguida.
- Mostrar **maquetas** antes de construir algo grande (ej. menú a pantalla completa) ahorra idas y vueltas.

## Errores que tuvimos (y la regla para no repetirlos)

| Error                                      | Causa                                                                                          | Regla                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Franja a la derecha en iPhone              | `overflow: clip` no existe en iOS < 16; sombras/filtros que "escapan" de un carrusel en Safari | `overflow: hidden` en contenedores; `contain: paint` en carruseles; probar en iPhone real |
| Se veían otras tortas al abrir el detalle  | `view-transition-name` fijo en todas las tarjetas + fundido de página                          | Nombres de transición **solo durante** la transición; coreografía sin fundido de raíz     |
| Parpadeo blanco al expandir                | La foto grande no estaba cargada                                                               | Precargar en hover/foco/toque y esperar `decode()` (con tope)                             |
| Se convertía en rectángulo                 | La imagen escalada perdía el redondeado                                                        | `::view-transition-image-pair { overflow: hidden; border-radius }`                        |
| Fondo saltaba a crema durante la animación | El overlay disparaba `pointerleave`                                                            | Mantener estado mientras dura la transición                                               |
| Se veía la sección anterior al llegar      | Margen de llegada + esquinas redondeadas                                                       | Llegar con el destino 2rem arriba (esquinas fuera de vista)                               |
| Llegaba corrido al destino                 | El alto cambiaba después de medir (filtro nuevo)                                               | Medir después de 2 `requestAnimationFrame`                                                |
| Sombra cortada en línea recta              | El carrusel recorta lo que sale de su caja                                                     | Dar `padding-block` (con margen negativo) al carrusel                                     |
| Degradé "mancha" entre secciones           | Gradiente sobre fondos que cambian de color                                                    | Hojas superpuestas en vez de degradés                                                     |
| Sombra con esquinas cuadradas              | `clip-path` rectangular recortaba la sombra                                                    | Sombra con `filter: drop-shadow` en el contenedor + clip redondeado                       |
| QR del doble factor invisible              | SVG crudo con `#` en un data URL                                                               | Re-codificar (`qrSeguro`) y simular con el formato real                                   |
| Pruebas que mentían                        | Medir antes de que arranque la animación; `                                                    | head`que esconde fallos; detectar overflow con`innerWidth` en modo celular                | Esperar el estado real; mirar el código de salida; medir ancho del documento vs. 390 |
| Contraste bajo                             | Rosa de marca con texto blanco (2.96:1)                                                        | Medir siempre (AA ≥ 4.5) y tener un tono "botón" aparte                                   |

## Forma de trabajar que dio resultado

1. **Feedback del cliente en su celular** → reproducir → arreglar → **medir** (no "a ojo").
2. Para animaciones: **sacar cuadros** de la transición y, si hace falta, **medir brillo** cuadro por cuadro para detectar parpadeos.
3. Revisar en **320, 390, 768, 1024, 1366 y 1920 px** + perfiles de iPhone/Android; el iPhone real es la prueba final (Safari tiene rarezas).
4. Cambios de "gusto" del cliente: **probarlos** (ej. sin pausa en compu) y dejar fácil volver atrás.
5. Cada arreglo, un commit chico con el "por qué".
