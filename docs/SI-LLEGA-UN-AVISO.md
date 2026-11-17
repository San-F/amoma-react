# Si llega un aviso

Una vez por mes, el **control de salud** (`.github/workflows/control-de-salud.yml`) mira desde afuera
que todo siga vivo: el sitio y sus cabeceras de seguridad, que la base no esté pausada y siga cerrada,
que el último backup tenga menos de 10 días y que los paquetes no tengan fallas de seguridad graves.
Si algo falla, abre un aviso en GitHub → Issues y **GitHub manda un mail** a quien sigue el repo.

Hay dos tipos de mail: **"Control de salud: hay algo para revisar"** (con el informe) o **"Run failed"**
de una tarea (Base despierta, Backup). Abrir Claude Code en este repo y decir:
_"Llegó este aviso: … Seguí `docs/SI-LLEGA-UN-AVISO.md`."_

| Dice…                                              | Qué significa                                           | Qué se hace                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| El sitio no responde                               | El hosting está caído o el dominio venció               | Mirar el estado de Cloudflare y, si hay dominio propio, su vencimiento                                         |
| Falta una cabecera / la CSP…                       | Se publicó algo que cambió `public/_headers`            | Revisar el último cambio de ese archivo y volver a publicar                                                    |
| http:// no redirige a https://                     | Se apagó "Always Use HTTPS" en el hosting               | Volver a prenderlo                                                                                             |
| sitemap.xml tiene otra dirección                   | Cambió la dirección del sitio y no se actualizó         | Corregir la dirección del sitio y publicar                                                                     |
| Base despierta falló / la base no responde         | La base se pausó (7 días sin actividad) o Supabase cayó | Supabase → inicio del proyecto → **Restore project**. Después revisar por qué no corrió la tarea               |
| El registro público está ABIERTO                   | Alguien cambió la configuración del login               | Apagarlo ya (`supabase/README.md`, "Login") y revisar Authentication → Users por cuentas desconocidas          |
| "No lee…" o "No cambia…" con ✗                     | Un permiso de la base quedó abierto                     | **Urgente.** No tocar a mano: correr `npm run test:db`, encontrar la diferencia con las migraciones y corregir |
| El último backup tiene N días / no se encontró     | La tarea de backup no corre o falla                     | Actions → Backup → ver el error. Lo más común: cambió la contraseña de la base (actualizar `SUPABASE_DB_URL`)  |
| Hay base pero el backup automático está apagado    | Falta la variable `BACKUPS_ENABLED`                     | `supabase/README.md`, "Mantenimiento automático"                                                               |
| Hay paquetes con vulnerabilidades altas o críticas | Salió un parche de seguridad                            | Actualizar el paquete (versión exacta), correr toda la verificación y publicar                                 |
| Falla simulada a propósito                         | Alguien probó el aviso                                  | Nada: cerrar el aviso                                                                                          |

Cuando está resuelto: Actions → Control de salud → **Run workflow** (tiene que dar verde) y cerrar el
aviso en Issues.

## Para que funcione (una vez)

- Las tareas programadas **solo corren desde `main`**: el control recién existe cuando se publica.
- Variables en GitHub → Settings → Secrets and variables → Actions → **Variables**: `SITIO_URL`
  (`https://amoma-1gq.pages.dev` hoy), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `BACKUPS_ENABLED`.
  Sin `SITIO_URL` la tarea no hace nada ("no falló" no significa "corrió").
- Para que el mail llegue: seguir el repo (Watch → All activity).
- Probar el aviso una vez: Actions → Control de salud → Run workflow → tildar **forzar_falla**. Tiene
  que aparecer un aviso en Issues y llegar el mail.

Fuente de lo de GitHub (tareas programadas solo desde la rama principal): documentación oficial de
GitHub, "Events that trigger workflows", sección `schedule` (leída para la plantilla el 16/11/2026).
