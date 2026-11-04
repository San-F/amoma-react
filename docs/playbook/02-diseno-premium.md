# 02 · Diseño premium

## Qué hace que una página "se vea cara"

1. **Fotos reales, consistentes y grandes.** Misma luz, mismo fondo, mismo encuadre. Es lo que más
   pesa. Nunca fotos de bancos/IA para mostrar productos que el negocio no hizo (engaña y es riesgo legal).
   Nunca fotos de Pinterest/Google: tienen dueño.
2. **Coherencia de marca** (lo que hace bien Lucciano's): 2–3 colores, 2 tipografías, el mismo tono
   en textos, botones y fotos. Premium = consistente, no cargado.
3. **Aire.** Secciones con mucho espacio arriba/abajo, textos cortos, una idea por sección.
4. **Tipografía con carácter** para títulos (serif expresiva tipo Fraunces) + una sans muy legible
   para textos (Manrope/Inter). Auto-alojadas.
5. **Ritmo claro/oscuro**: alternar fondos (crema → franja oscura → beige) da sensación editorial.
6. **Detalles editoriales**: numeración 01/02/03, líneas finas, cursivas en una palabra clave, una
   cinta de texto que pasa lento.
7. **Pocas animaciones, muy cuidadas**: el texto entra línea por línea, la foto se agranda al abrir
   (View Transitions), parallax sutil. Nada que distraiga ni que haya que "aprender a usar".

## Recorrido pensado desde el usuario

La mayoría llega **desde Instagram, en el celular, con poco tiempo**. La home responde, en orden:
¿qué es esto? (portada) → ¿qué hacen? (categorías) → ¿qué puedo pedir? (catálogo) →
¿y si quiero algo especial? (personalizado) → ¿cómo pido? (3 pasos) → contacto.

Cada sección tiene **un** botón principal. Todo termina en la acción que importa
(acá: WhatsApp con el mensaje ya escrito).

## Celular primero

- Diseñar a 375–390 px de ancho y después agrandar.
- Zonas táctiles ≥ 44 px; botón principal al alcance del pulgar.
- Carruseles con scroll nativo + `scroll-snap` (se deslizan con el dedo, sin librerías).
- Nada que dependa de hover. Sin cursores personalizados en celular.
- Paneles de detalle como "hoja" que sube desde abajo.
- Verificar que **nada se salga del ancho** (un halo decorativo de 2 px ya genera scroll lateral).

## Motion: reglas

- Respetar siempre `prefers-reduced-motion` (el CSS global lo apaga).
- Animar solo `transform` y `opacity` (fluido en celulares).
- Animaciones en loop solo **mientras están en pantalla** (IntersectionObserver) para no gastar batería.
- Preferir CSS y APIs nativas (View Transitions, scroll-driven animations) antes que librerías.

## Lo que probamos y NO funcionó (Amoma)

- **Armador de torta paso a paso**: lindo en teoría, pero agrega fricción. Lo personalizado se resuelve
  mejor conversando → reemplazado por una animación que se arma sola + un campo de texto a WhatsApp.
- **Fotos de banco en categorías** (rollos de canela en "Tortas"): incoherente → foto real del producto.
- **Portada oscura a pantalla completa**: a la clienta le gustó más la versión crema con las dos tortas
  en arco. Mostrar alternativas y dejar elegir.

## Contraste (no negociable)

- Texto normal ≥ 4.5:1, texto grande ≥ 3:1 (WCAG AA). Medirlo, no "a ojo".
- El rosa de marca (#e76f92) con texto blanco da 2.96:1 → se usa otro tono para botones (#c4466f, 4.7:1)
  y el original queda para detalles decorativos.

## Avisos de cookies

Si la página **no usa cookies ni rastreo**, no se pone banner (es ruido). Si algún día hace falta:
chico, en una esquina, "Aceptar" y "Rechazar" del mismo tamaño, sin bloquear la página (estilo luccianos.net).
