# 08 · Velocidad, Google y accesibilidad

## Velocidad

- Fotos del sitio: AVIF + WebP + JPEG en varios anchos con `srcset`/`sizes` (vite-imagetools).
- Fotos que sube el cliente: se achican **en el navegador** a WebP ~1600 px antes de subir.
- La foto principal (portada) con `loading="eager"` y `fetchPriority="high"`; el resto `lazy`.
- Fuentes auto-alojadas, solo los pesos/ejes que se usan.
- El panel de admin y librerías pesadas (Excel, Supabase) se cargan **aparte** (import dinámico).
- Assets con hash → caché de 1 año (`immutable`).
- Objetivo: Lighthouse ≥ 90 en celular.

## Google y compartir

- `<title>` y `meta description` por página; `lang="es-AR"`.
- Open Graph + Twitter card con imagen 1200×630 de marca → linda vista previa en WhatsApp/Instagram.
- Datos estructurados schema.org (`Bakery`, `LocalBusiness`, `SportsActivityLocation` para gym).
- `robots.txt` (bloquear `/admin`) y `sitemap.xml`. Panel con `X-Robots-Tag: noindex`.
- Al tener dominio propio: actualizar canonical, OG, sitemap; dar de alta en Google Search Console
  y en **Google Business Profile** (mapa, horarios, reseñas reales).

## Accesibilidad (también es calidad)

- Contraste AA (4.5:1 texto normal). Medirlo.
- Todo usable con teclado; foco visible; link "saltar al contenido".
- Modales con `<dialog>` nativo (atrapa el foco, Escape cierra).
- Imágenes con `alt` descriptivo; decorativas con `alt=""`/`aria-hidden`.
- Formularios con `<label>` asociado; errores con `role="alert"`.
- Respetar "reducir movimiento".
- Auditoría automática con **axe-core** en cada página (0 errores) + prueba manual con teclado.
