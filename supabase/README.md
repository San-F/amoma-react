# Base de datos (Supabase)

## Qué hay acá

| Archivo                             | Qué hace                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `migrations/..._catalog_schema.sql` | Tablas: categorías, productos, precios, fotos, galería, consultas, ajustes, admins, auditoría |
| `migrations/..._rls_and_grants.sql` | Permisos: quién puede leer/escribir cada cosa (RLS)                                           |
| `migrations/..._storage.sql`        | Carpeta de fotos: pública para ver, solo admin para subir; máx. 8 MB, solo imágenes           |
| `seed.sql`                          | Datos iniciales (categorías y datos del negocio). Sin precios inventados.                     |
| `tests/rls.test.sql`                | 60 tests que intentan romper los permisos como visitante, usuario común y admin               |

## Correr los tests (local / CI)

```bash
npm run test:db
```

Necesita un Postgres local (variables `PGHOST`, `PGPORT`, `PGUSER`). En GitHub corre solo en cada cambio.

## Aplicar en el proyecto real (una sola vez)

1. Supabase → **SQL Editor** → pegar y ejecutar, **en orden**, cada archivo de `migrations/` y después `seed.sql`.
2. **Authentication → Sign In / Providers → Email**: desactivar **"Allow new users to sign up"**
   (solo entra quien invitamos).
3. **Authentication → Users → Invite user** con el email de la dueña.
4. SQL Editor, para hacerla admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL_DE_LA_DUEÑA';
   ```
5. **Advisors → Security Advisor**: tiene que quedar sin alertas críticas.

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
