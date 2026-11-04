# Playbook — cómo hacemos páginas web profesionales

Todo lo aprendido armando **Amoma** (pastelería), escrito para reutilizar en el próximo proyecto
(gimnasio, turnos, tienda…). Cada archivo es un frente; leelos en orden la primera vez.

| #   | Archivo                                                         | Qué tiene                                                              |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 01  | [Proceso paso a paso](01-proceso.md)                            | Etapas, "listo cuando…", cómo trabajar con la IA sin que se mezcle     |
| 02  | [Diseño premium](02-diseno-premium.md)                          | Qué hace que una página se vea cara, celular primero, fotos, motion    |
| 03  | [Seguridad (base)](03-seguridad.md)                             | Fuentes reconocidas (OWASP, NIST) + checklist general + perfil gym     |
| 04  | [Login y cuentas](04-login.md)                                  | Contraseñas, doble factor, invitaciones, recuperación, sesiones        |
| 05  | [Base de datos](05-base-de-datos.md)                            | Supabase, RLS, permisos, migraciones, tests de permisos, backups       |
| 06  | [Fraudes y abuso](06-fraudes.md)                                | Comprobantes falsos, suplantación, phishing, spam, robo de cuentas     |
| 07  | [Errores frecuentes (IA y humanos)](07-errores-frecuentes.md)   | Lo que sale mal seguido, incluidos los errores reales de este proyecto |
| 08  | [Velocidad, Google y accesibilidad](08-rendimiento-seo-a11y.md) | Fotos, SEO, vista previa al compartir, contraste, lectores de pantalla |
| 09  | [Publicar, operar y entregar](09-operacion-y-entrega.md)        | Hosting gratis, dominio, mails, backups, costos, entrega al cliente    |
| 10  | [Cómo pedirle cosas a Claude](10-prompts.md)                    | Plantillas de mensajes para cada etapa                                 |

## Cómo usarlo en un proyecto nuevo

1. Copiá la carpeta `docs/playbook/` y el archivo `CLAUDE.md` de la raíz al repo nuevo.
2. Editá en `CLAUDE.md` la sección "Este proyecto" (nombre, rubro, stack).
3. Primer mensaje a Claude: _"Leé CLAUDE.md y docs/playbook/. Armá el plan por etapas para [proyecto]"_
   (ver [10-prompts.md](10-prompts.md)).

`CLAUDE.md` es especial: Claude Code lo lee **automáticamente** al empezar cada sesión en ese repo.
Ahí van las reglas que no queremos repetir nunca más.

## Plantilla de código reutilizable

Además de estos textos, Amoma tiene piezas de código que se copian tal cual a otro proyecto:

| Pieza                                | Dónde está en Amoma                                                  |
| ------------------------------------ | -------------------------------------------------------------------- |
| Roles + MFA obligatorio              | `supabase/migrations/*_admin_mfa.sql`                                |
| RLS + permisos cerrados              | `supabase/migrations/*_rls_and_grants.sql`                           |
| Tests de permisos (SQL)              | `supabase/tests/` (`npm run test:db`)                                |
| Login, MFA, invitación, recuperación | `src/admin/auth.jsx`, `src/admin/pages/{Login,Acceso,Seguridad}.jsx` |
| Importar desde Excel                 | `src/admin/lib/importer.js` + RPC `admin_import_catalog`             |
| Compresión de fotos                  | `src/admin/lib/images.js`                                            |
| Cabeceras de seguridad               | `public/_headers` (Cloudflare) / `vercel.json`                       |
| CI + Dependabot + backups            | `.github/`                                                           |
