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

1. Supabase → **SQL Editor** → pegar y ejecutar, **en orden**, cada archivo de `migrations/` y después `seed.sql`.
2. **Advisors → Security Advisor**: tiene que quedar sin alertas críticas.

### 2. Login

3. **Authentication → Sign In / Providers → Email**: desactivar **"Allow new users to sign up"**
   y poner **mínimo de contraseña 15**.
4. **Authentication → URL Configuration**: _Site URL_ = dirección de la página
   (hoy `https://amoma-react.vercel.app`). En _Redirect URLs_ solo esa dirección.
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

| Tipo     | Nombre                     | Valor                                                                |
| -------- | -------------------------- | -------------------------------------------------------------------- |
| Variable | `SUPABASE_URL`             | Project URL (pública)                                                |
| Variable | `SUPABASE_PUBLISHABLE_KEY` | Publishable key (pública)                                            |
| Variable | `BACKUPS_ENABLED`          | `true`                                                               |
| Secret   | `SUPABASE_DB_URL`          | Connect → **Session pooler** (incluye la contraseña de la base)      |
| Secret   | `BACKUP_PASSPHRASE`        | Frase larga inventada; guardarla también en el gestor de contraseñas |

- **Keepalive** (`supabase-keepalive.yml`): cada 3 días hace una lectura para que el proyecto gratis no se pause.
- **Backup** (`supabase-backup.yml`): cada domingo guarda los datos **encriptados** en la rama `backups` (últimas 12 semanas).
  Las fotos no van en el backup: conservar los originales.
