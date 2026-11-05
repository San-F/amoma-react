# Pendientes

Lista viva. ✅ = hecho · ⏳ = en curso · 🔲 = falta

## Para vos (Francisco)

### Cuando estés en casa

- 🔲 Pasarme la **Project URL** y la **publishable key** de Supabase (son públicas).
  ❌ Nunca la secret key ni la contraseña de la base.
- 🔲 Seguir la **puesta en marcha** de [`supabase/README.md`](../supabase/README.md) (te guío paso a paso):
  migraciones, registro apagado, mails de invitación, invitar a la dueña.
- 🔲 Cargar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en Vercel (o Cloudflare) y redeploy.
- 🔲 Crear cuenta gratis en **Cloudflare**: Pages (mudanza) + Turnstile (anti-robots del login).
- 🔲 GitHub → Variables y Secrets para keepalive y backups (ver `supabase/README.md`).

### Con la clienta (dueña de Amoma)

- 🔲 Instalar **Google Authenticator** o **Microsoft Authenticator** (doble factor del panel).
- 🔲 Lista de productos con **tamaños, porciones y precios** → la cargamos con la **planilla Excel** del panel.
- 🔲 Confirmar descripciones de las tortas (las actuales son de ejemplo).
- 🔲 ¿Hace **envíos** o solo retiro? (se menciona en "Cómo pedir").
- 🔲 Horarios y anticipación mínima para pedidos (hoy el formulario pide 3 días para personalizadas).
- 🔲 Fotos nuevas con **misma luz y mismo fondo**. Guardar siempre los originales.
- 🔲 Revisar el texto de **Privacidad**.
- 🔲 Testimonios **reales** (con permiso) si quiere mostrarlos.
- 🔲 ¿Dominio propio (`amoma.com.ar`, pago anual en NIC Argentina) o el gratis?
- 🔲 Leer juntos [`docs/playbook/06-fraudes.md`](playbook/06-fraudes.md) (comprobantes falsos, phishing).

## Para mí (Claude)

- ✅ Etapa 0 — Fundaciones y seguridad base
- ✅ Etapa 1 — Base de datos, permisos (88 tests), importación desde Excel en la base
- ✅ Etapa 2 — Panel de admin: login, doble factor, invitación/recuperación, productos, precios,
  fotos, Excel, categorías, consultas, ajustes (probado con Supabase simulado)
- ✅ Etapa 3 — El sitio lee productos, precios y ajustes de la base (con respaldo fijo) + aviso destacado
- ✅ Etapa 4 — Front premium v2 (portada elegida por la clienta, categorías, catálogo estilo Lucciano's,
  personalizada animada, cómo pedir)
- ✅ Etapa 5 — Google y compartir (OG, schema.org, sitemap), accesibilidad (axe sin errores), privacidad
- ✅ Playbook reutilizable + `CLAUDE.md`
- ✅ "Tu pedido": varios productos en un solo WhatsApp, cambiar tamaño/cantidad, queda guardado en el celular
- 🔲 Conectar con Supabase real y probar de punta a punta (necesita las claves)
- ✅ Formulario de contacto guarda las consultas en el panel (límite de envíos + trampa para robots,
  sin guardar IPs); si falla, ofrece WhatsApp. Sin base conectada sigue abriendo WhatsApp
- ✅ Galería administrable desde el panel (subir, describir, ordenar, ocultar, borrar)
- 🔲 Aviso por email a la dueña cuando entra una consulta (necesita configurar un servicio de mails;
  hoy las ve en el panel → Resumen)
- 🔲 Hacer administrables las tarjetas de "Elegí por dónde empezar" y los filtros del catálogo
  (que salgan de las categorías del panel, con foto de portada por categoría). Hacerlo cuando la
  clienta defina sus categorías: hoy son fijas en `src/data/catalog.js`
- 🔲 Mudanza a Cloudflare Pages (archivos ya listos: `public/_headers`, `public/_redirects`)
- 🔲 Medir con Lighthouse en el sitio publicado
- ✅ Guía de uso del panel para la dueña, con capturas: [`docs/GUIA-PANEL.md`](GUIA-PANEL.md)
- ✅ Auditoría de seguridad del código: [`docs/AUDITORIA.md`](AUDITORIA.md) (OWASP Top 10:2025)
- 🔲 Etapa 6 — Verificar la configuración real con el checklist de la auditoría
- 🔲 Al final: extraer la **plantilla** a un repo propio para el próximo proyecto (gimnasio)
