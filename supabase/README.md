# Base de datos (Supabase)

## Qué hay acá

| Archivo                             | Qué hace                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `migrations/..._catalog_schema.sql` | Tablas: categorías, productos, precios, fotos, galería, consultas, ajustes, admins, auditoría |
| `migrations/..._rls_and_grants.sql` | Permisos: quién puede leer/escribir cada cosa (RLS)                                           |
| `migrations/..._storage.sql`        | Carpeta de fotos: pública para ver, solo admin para subir; máx. 8 MB, solo imágenes           |
| `migrations/..._admin_mfa.sql`      | Ser admin exige lista blanca **y** doble factor (aal2)                                        |
| `migrations/..._import_catalog.sql` | Importación desde Excel en una sola transacción (todo o nada)                                 |
| `migrations/..._submit_inquiry.sql` | Formulario de contacto: el público solo puede enviar; límite de envíos y trampa para robots   |
| `seed.sql`                          | Datos iniciales (categorías y datos del negocio). Sin precios inventados.                     |
| `tests/rls.test.sql`                | 88 tests que intentan romper los permisos como visitante, usuario común y admin               |

## Correr los tests (local / CI)

```bash
npm run test:db
```

Necesita un Postgres local (variables `PGHOST`, `PGPORT`, `PGUSER`). En GitHub corre solo en cada cambio.

## Puesta en marcha (una sola vez) — paso a paso

### 1. Base de datos

1. Supabase → **SQL Editor** → pegar y ejecutar **`supabase/puesta-en-marcha.sql`** (un solo archivo: todas las migraciones + datos iniciales).
2. **Advisors → Security Advisor**: tiene que quedar sin alertas críticas.

### 2. Login

3. **Authentication → Sign In / Providers → Email**: desactivar **"Allow new users to sign up"**
   y poner **mínimo de contraseña 15**.
4. **Authentication → URL Configuration**: _Site URL_ = dirección de la página
   (la misma de `src/data/direccion.js`; hoy `https://amoma-1gq.pages.dev`). En _Redirect URLs_ solo esa dirección.
5. **Authentication → Emails → Templates**:
   - _Invite user_: cambiar el link por
     `{{ .SiteURL }}/admin/acceso?token_hash={{ .TokenHash }}&type=invite`
   - _Reset password_: cambiar el link por
     `{{ .SiteURL }}/admin/acceso?token_hash={{ .TokenHash }}&type=recovery`
6. **Authentication → Multi-Factor**: TOTP habilitado.
7. (Recomendado) **Cloudflare Turnstile**: crear un widget gratis en dash.cloudflare.com → Turnstile,
   pegar la **secret key** en Supabase → _Authentication → Attack Protection → CAPTCHA_, y la
   **site key** (pública) en `VITE_TURNSTILE_SITE_KEY`.

### 3. La dueña

8. **Authentication → Users → Invite user** con su email.
9. SQL Editor, para hacerla admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL_DE_LA_DUEÑA';
   ```
10. Ella abre el mail, crea su contraseña y escanea el QR con Google/Microsoft Authenticator.

### 4. Variables en el hosting (Vercel o Cloudflare Pages → Settings → Environment variables)

| Variable                        | Valor                            |
| ------------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`             | Project URL (pública)            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (pública)        |
| `VITE_TURNSTILE_SITE_KEY`       | Site key de Turnstile (opcional) |

Después de cargarlas, volver a publicar (redeploy).

## Mantenimiento automático (GitHub → Settings → Secrets and variables → Actions)

| Tipo     | Nombre                     | Valor                                                                 |
| -------- | -------------------------- | --------------------------------------------------------------------- |
| Variable | `SITIO_URL`                | Dirección publicada del sitio (`https://…`), para el control de salud |
| Variable | `SUPABASE_URL`             | Project URL (pública)                                                 |
| Variable | `SUPABASE_PUBLISHABLE_KEY` | Publishable key (pública)                                             |
| Variable | `BACKUPS_ENABLED`          | `true`                                                                |
| Secret   | `SUPABASE_DB_URL`          | Connect → **Session pooler** (incluye la contraseña de la base)       |
| Secret   | `BACKUP_PASSPHRASE`        | Frase larga inventada; guardarla también en el gestor de contraseñas  |

- **Keepalive** (`supabase-keepalive.yml`): cada 3 días hace una lectura para que el proyecto gratis no se pause.
- **Control de salud** (`control-de-salud.yml`): una vez por mes mira sitio, base, backup y paquetes; si algo
  falla abre un aviso en Issues y GitHub manda el mail. Qué hacer: `docs/SI-LLEGA-UN-AVISO.md`.
- **Backup** (`backup.yml`): cada domingo guarda en la rama `backups` los datos **encriptados**
  (`db/`, últimas 12 semanas) y las **fotos** (`fotos/`, sin encriptar porque ya son públicas; una foto
  borrada en el panel queda guardada ahí). No guarda los usuarios, la lista de administradores ni el
  registro de cambios: en una base nueva el administrador se da de alta otra vez.

## Backup y restauración

Un backup que nunca se restauró no es un backup. La ida y vuelta de los **datos** se prueba sola en cada
cambio (`supabase/tests/backup-ida-y-vuelta.sh`, dentro de `npm run test:db`). La restauración completa
en Supabase, con fotos, hay que **ensayarla una vez** (y cada 6 meses):

1. **Base nueva.** Crear un proyecto de Supabase de prueba. Generar solo la estructura, sin datos:
   `bash supabase/armar-puesta-en-marcha.sh --sin-datos /tmp/estructura.sql`, y pegarla en el SQL Editor.
2. **Bajar el backup.** En GitHub, rama `backups`: el `.sql.gpg` más nuevo y la carpeta `fotos/`.
3. **Datos** (pide la frase del backup; si la base ya tiene datos, se niega):
   ```bash
   bash scripts/restaurar-backup.sh datos backup-AAAA-MM-DD.sql.gpg "<cadena de conexión de la base nueva>"
   ```
4. **Fotos** (la clave secreta de la base **nueva**, solo como variable de entorno, nunca en un archivo ni en el chat):
   ```bash
   SUPABASE_SECRET_KEY=… bash scripts/restaurar-backup.sh fotos fotos https://<nueva>.supabase.co
   ```
5. **Administrador y login:** puntos 2 y 3 de la puesta en marcha.
6. **Comprobar** con `comprobar-base.sh` y abriendo el sitio apuntando a la base nueva (`.env.local`).

**No se pudo probar desde acá:** la tarea corriendo en GitHub contra la base real, la bajada de fotos y
su subida con la clave secreta. Por eso el ensayo es obligatorio.
