# Reglas de trabajo (leer siempre al empezar)

Idioma: **español rioplatense** en textos, UI, commits de documentación y explicaciones al usuario.
El usuario no es programador: explicar en simple, sin jerga, y avisar qué necesita hacer él.

Guía completa: [`docs/playbook/`](docs/playbook/README.md). Plan del proyecto: [`docs/PLAN.md`](docs/PLAN.md).
Pendientes: [`docs/PENDIENTES.md`](docs/PENDIENTES.md) (mantenerlo actualizado).

## Cómo trabajar

1. **Una etapa a la vez**, con "listo cuando…" verificable. No mezclar frentes en un mismo cambio.
2. Antes de decir "listo": `npm run check` (lint + formato + tests + build) y `npm run test:db`,
   **mirando el código de salida** (no esconderlo con `| head`/`| grep`), y abrir la página en
   Playwright en **390 px y 1366 px** (capturas, sin scroll lateral, sin errores de consola).
3. Probar el caso malo: ante cambios de permisos, introducir el error a propósito y ver que el test falla.
4. Commits chicos y explicativos. Trabajar en la rama asignada; a `main` solo con OK del usuario.
5. Actualizar `docs/PENDIENTES.md` y, si se aprende algo nuevo, el playbook.

## Seguridad (no negociable)

- Ningún secreto en el front ni en `VITE_*` (todo `VITE_*` es público). `.env*` ignorado salvo `.env.example`.
- RLS en todas las tablas; permisos cerrados por defecto; nada de `USING (true)` para escribir.
- "Logueado ≠ admin": rol en tabla + `is_admin()` exige MFA (`aal2`). La base decide, no la pantalla.
- Validar en el servidor/base además del formulario. Mensajes de error genéricos al usuario.
- Antes de instalar un paquete: `npm view` (existe, repo oficial, mantenedores); instalar con `-E`.
- Sin scripts de terceros salvo los imprescindibles (hoy: solo Cloudflare Turnstile en el login).
- Nunca pedir ni aceptar contraseñas/secret keys por el chat. Si el usuario pega una, pedir que la rote.

## Diseño

- Antes de diseñar, leer `docs/playbook/11-lecciones-amoma.md` (recursos premium probados y errores a no repetir) y revisar `12-checklist-calidad.md` antes de publicar.

- Celular primero (390 px). Fotos **reales** del negocio; nunca de banco/IA/Pinterest para productos.
- Contraste AA medido (botón rosa `--rosa-boton`, no `--rosa`). `prefers-reduced-motion` siempre.
- Pocas secciones, cada una con un propósito y un botón principal. Ver `docs/DESIGN.md`.

## Este proyecto

- **Amoma**: pastelería casera en Villa Pueyrredón (CABA). Pedidos por WhatsApp.
- Stack: React 19 + Vite + React Router 7 · Supabase (Postgres, Auth, Storage) · Cloudflare Pages
  (hoy también Vercel) · todo en planes **gratis sin tarjeta**.
- Código: `src/sections` (home), `src/pages`, `src/components`, `src/lib` (sitio, supabase, plata,
  WhatsApp), `src/admin` (panel, carga diferida), `supabase/` (migraciones, seed, tests).
- Datos públicos: `src/lib/sitio.js` lee Supabase y, si falla o está vacío, usa `src/data/catalog.js`.
- Comandos: `npm run dev` · `npm run check` · `npm run test:unit` ·
  `PGHOST=… PGPORT=… PGUSER=postgres npm run test:db` (Postgres local descartable).

## Llevar este sistema a otro proyecto (mensaje para el Claude del futuro)

Si en otro repo el usuario dice algo como _"fijate el sistema de Amoma"_ o _"usá lo de Amoma"_:

1. Leé `docs/playbook/README.md` de este repo (`San-F/amoma-react`) y después las guías que apliquen.
   Si la sesión no tiene acceso a este repo, pedí agregarlo (lectura alcanza).
2. Copiá al repo nuevo la carpeta `docs/playbook/` completa.
3. Copiá `docs/playbook/CLAUDE.plantilla.md` a la **raíz** del repo nuevo como `CLAUDE.md` y completá
   la sección "Este proyecto" con lo que cuente el usuario.
4. Armá `docs/PLAN.md` por etapas (ver `01-proceso.md`) y `docs/PENDIENTES.md`, y frená para que el
   usuario lo apruebe antes de programar.
5. Reutilizá el código probado de Amoma (tabla en `docs/playbook/README.md` → "Plantilla de código
   reutilizable"): roles + MFA, RLS + tests de permisos, login, Excel, compresión de fotos, cabeceras, CI.
