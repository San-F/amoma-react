# 12 · Checklist de calidad antes de publicar

Basado en el checklist "vibe coding" del usuario (8 videos + lista SEO). Antes de entregar, marcar
cada punto como ✅ cumple / ➖ no aplica / 🔲 pendiente.

## Diseño

- [ ] Sin patrones genéricos de IA (degradés en textos, íconos + etiqueta en cada título, tarjetas para todo). Lo editorial sutil sí.
- [ ] Poco ruido visual: cada elemento con una razón. Un nombre por cosa.
- [ ] Coherencia: espaciados, tipografías, paleta y botones iguales en todo el sitio.
- [ ] Textos claros y consistentes; revisar repeticiones.

## Errores y experiencia

- [ ] Error boundaries por sección + página de error (nunca pantalla en blanco).
- [ ] Estados cargando / error (con reintentar) / vacío en toda carga de datos.
- [ ] 404 propia; cero links rotos e imágenes que no cargan.
- [ ] Formularios que llegan de verdad (base, WhatsApp, email).

## Accesibilidad

- [ ] 100% con teclado, foco visible. `alt` descriptivo. Contraste AA medido. Etiquetas en campos.
- [ ] Zonas táctiles ≥ 44 px. "Reducir movimiento" no deja nada invisible. axe sin errores.

## Seguridad

- [ ] Ninguna clave privada en el navegador (la publishable/anon sí; service_role nunca).
- [ ] Sin source maps en producción.
- [ ] Login probado (Supabase Auth), roles en tabla, RLS en todas las tablas, MFA para admins.
- [ ] Rate limiting y validación en servidor/base.

## Costos

- [ ] Planes sin tarjeta o con límite/alerta de gasto. Sin funciones recursivas ni loops de consumo.

## Estructura y despliegue

- [ ] Git, etapas, deploy real, imágenes modernas + carga diferida, código dividido (lazy).

## Pruebas

- [ ] Lógica crítica (plata, cálculos) con tests. Permisos con tests.
- [ ] Recorridos principales con Playwright, idealmente corriendo en GitHub Actions.

## Monitoreo y legal

- [ ] Reporte de errores (ej. Sentry) — pendiente en Amoma.
- [ ] Consentimiento para mensajes de marketing. Privacidad publicada.

## SEO y visibilidad

- [ ] Dominio propio. HTML con contenido real (pre-render/SSR) — pendiente en Amoma.
- [ ] Título y meta description únicos por página. Canonical por página.
- [ ] Open Graph con imagen. schema.org (LocalBusiness/Product). Un solo H1 por página.
- [ ] `robots.txt`, `sitemap.xml` (enviar a Search Console), `llms.txt`, favicon + íconos iPhone/Android, `lang`.
- [ ] Cero errores en consola.
