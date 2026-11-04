# 05 · Base de datos (Supabase / Postgres)

## Principios

1. **Cerrado por defecto.** Se revoca todo a `anon`/`authenticated` y se otorga solo lo necesario.
   También para tablas **futuras** (`alter default privileges … revoke`).
2. **RLS en todas las tablas**, sin excepción. RLS decide _qué filas_; los GRANT deciden _qué operaciones_.
3. **Nada de `USING (true)` en escritura.** Lectura pública solo de lo publicado.
4. **Funciones auxiliares en un esquema `private`** (no expuesto por la API) con
   `security definer` + `set search_path = ''`.
5. **`(select private.is_admin())` entre paréntesis** en las políticas: se evalúa una vez por consulta.
6. **Plata en centavos (entero)**, nunca `float`.
7. **Validar también en la base**: `check` de largo, formato (slug, email), rangos (precio ≥ 0).
8. **Migraciones versionadas** en `supabase/migrations/`. Nunca cambios "a mano" en el panel.
9. **Operaciones de varios pasos = una función SQL** (transacción): todo o nada (ej. importar Excel).
10. **Auditoría**: trigger que registra quién cambió qué y cuándo.

## Tests de permisos (lo que más vale)

`supabase/tests/rls.test.sql` se hace pasar por cada rol y **intenta lo prohibido**:

- anónimo: leer datos personales, crear, borrar, cambiar precios, subir archivos, hacerse admin;
- usuario logueado sin rol: lo mismo;
- admin **sin** doble factor: no puede escribir;
- admin con doble factor: sí puede, y queda registrado;
- chequeos estructurales: toda tabla con RLS, ninguna política `true` en escritura, tablas futuras cerradas.

Se corren en CI contra un Postgres real (`npm run test:db`). **Prueba de fuego**: meter a propósito
un error típico (política `true`, RLS apagado) y ver que el test falle.

## Archivos (Storage)

- Bucket público para fotos del sitio: se ve por URL, pero **sin política SELECT para anon** (no se
  puede listar el bucket). Subir/borrar: solo admin.
- Tipo y tamaño limitados **en el bucket** (`allowed_mime_types`, `file_size_limit`), no solo en el front.
- Nombres generados (UUID). Nunca el nombre original del archivo.
- Fotos privadas (ej. apto médico del gimnasio): bucket **privado** + URLs firmadas de vida corta.

## Plan gratis: cuidados

- El proyecto se **pausa tras 7 días sin uso** → workflow `supabase-keepalive.yml` (cada 3 días).
- Sin backups automáticos → `supabase-backup.yml`: `pg_dump` semanal **encriptado** (gpg AES256) a una
  rama `backups`. Encriptado porque los datos tienen información de clientes.
- La conexión directa es solo IPv6: para GitHub Actions usar el **Session pooler**.
- Las fotos de Storage no entran en el dump: conservar originales.

## Claves

| Clave                  | ¿Pública? | Dónde va                                              |
| ---------------------- | --------- | ----------------------------------------------------- |
| Project URL            | Sí        | Front (`VITE_SUPABASE_URL`)                           |
| Publishable / anon key | Sí        | Front (`VITE_SUPABASE_PUBLISHABLE_KEY`)               |
| Secret / service_role  | **NO**    | Solo Edge Functions / secrets de CI. Saltea RLS.      |
| Contraseña de la base  | **NO**    | Gestor de contraseñas + secret de GitHub para backups |

Si una clave secreta se filtra (chat, commit, captura): **se rota** ese mismo día.
