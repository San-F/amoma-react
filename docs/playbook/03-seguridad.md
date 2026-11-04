# Base de seguridad reutilizable

Esta guía **no es solo para Amoma**. Es la base que se copia a cada proyecto nuevo
(repostería, gimnasio, turnos, etc.). Lo específico de cada proyecto va al final, en
"Perfiles de proyecto".

Regla: **si un punto no se cumple, no se publica.**

---

## 1. Fuentes reconocidas (en orden de uso)

| Fuente                                                                                                                | Para qué la usamos                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [OWASP Top 10:2025](https://owasp.org/Top10/2025/)                                                                    | Los 10 riesgos más comunes. El #1 es **Control de acceso roto**. Mapa general.                                                |
| [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/)                           | **Checklist verificable** (~350 requisitos en 3 niveles). Nivel 1 para sitios simples, nivel 2 para cualquier cosa con login. |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) ([GitHub](https://github.com/OWASP/CheatSheetSeries)) | "Cómo se hace bien" por tema: login, sesiones, contraseñas olvidadas, subida de archivos, CSP, MFA.                           |
| [NIST SP 800-63B-4](https://csrc.nist.gov/pubs/sp/800/63/b/4/final) (jul. 2025)                                       | Norma de referencia para contraseñas, MFA y passkeys.                                                                         |
| [Supabase — Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)                        | Lista oficial antes de salir a producción + _Security Advisor_ del panel.                                                     |
| [MDN — Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)                                           | Referencia técnica de cabeceras, CSP, cookies.                                                                                |
| [OWASP Juice Shop](https://github.com/juice-shop/juice-shop)                                                          | App **vulnerable a propósito** para aprender cómo se rompen las cosas. Ejemplo de qué _no_ hacer.                             |
| Ley 25.326 de Protección de Datos Personales (Argentina)                                                              | Qué datos se pueden guardar, consentimiento, y datos **sensibles** (salud).                                                   |

Herramientas para medir:

- [Mozilla HTTP Observatory](https://developer.mozilla.org/en-US/observatory) y [securityheaders.com](https://securityheaders.com) → nota de cabeceras (objetivo: **A**).
- `npm audit`, **Dependabot**, **GitHub secret scanning** y **CodeQL** → dependencias, claves filtradas, análisis de código.
- Supabase **Security Advisor** → tablas sin RLS, funciones inseguras.

---

## 2. Checklist base (todo proyecto)

### 2.1 Secretos

- [ ] Ningún secreto en el código ni en el historial de git. `.env` ignorado; `.env.example` sin valores.
- [ ] En Vite, **toda variable `VITE_*` es pública**. Solo va ahí lo que puede ver cualquiera (URL de Supabase, _anon key_).
- [ ] Claves de servidor (`service_role`, API de pagos, email) **solo** en el servidor/Edge Functions.
- [ ] Si una clave se filtra: se **rota**, no alcanza con borrarla del repo.

### 2.2 Autenticación (login)

- [ ] Usar un proveedor probado (Supabase Auth). **Nunca** inventar login propio ni guardar contraseñas a mano.
- [ ] Registro público **deshabilitado** si solo entra staff; las cuentas se crean por invitación.
- [ ] Contraseñas: mínimo 15 caracteres si es el único factor, sin reglas raras de "una mayúscula y un símbolo", chequeo contra contraseñas filtradas (NIST 800-63B-4).
- [ ] **MFA obligatorio para administradores** (TOTP o passkeys).
- [ ] Límite de intentos de login y de "olvidé mi contraseña".
- [ ] Mensajes de error genéricos ("email o contraseña incorrectos"), sin revelar si el email existe.
- [ ] Cerrar sesión invalida la sesión de verdad; sesiones con vencimiento.

### 2.3 Autorización (quién puede hacer qué)

- [ ] **La base de datos decide**, no el front. Ocultar un botón no protege nada.
- [ ] RLS activado en **todas** las tablas. Sin políticas `USING (true)` para escritura.
- [ ] Roles en una tabla propia (`admins`, `staff`, `members`…), nunca "cualquier usuario logueado".
- [ ] Un usuario solo ve **sus** datos (`user_id = auth.uid()`), salvo roles explícitos.
- [ ] Tests automáticos de permisos: anónimo, usuario común y admin, por cada tabla.
- [ ] IDs no adivinables (UUID) en todo lo que se expone en URLs.

### 2.4 Entradas, salidas y archivos

- [ ] Validación con esquema (Zod) **en el servidor**. La del formulario es solo comodidad.
- [ ] Nada de `dangerouslySetInnerHTML` con contenido de usuarios.
- [ ] Subidas: tipos permitidos y tamaño máximo en el bucket, nombre generado (UUID), re-compresión.
- [ ] Formularios públicos: anti-bot (Turnstile) + límite de envíos.
- [ ] Errores: al usuario un mensaje amable; el detalle técnico va a los logs, nunca a la pantalla.

### 2.5 Navegador y despliegue

- [ ] Cabeceras: CSP estricta, HSTS, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] Sin scripts de terceros innecesarios (cada uno puede ejecutar código en tu sitio).
- [ ] HTTPS siempre. Dominios de preview no indexados.

### 2.6 Dependencias

- [ ] Verificar que cada paquete exista y sea el oficial antes de instalarlo (la IA inventa nombres).
- [ ] Versiones fijadas con `package-lock.json`; `npm ci` en CI.
- [ ] CI corta si hay vulnerabilidades altas o críticas.

### 2.7 Datos personales

- [ ] Guardar **solo** lo necesario. Nada de `console.log` con datos de clientes.
- [ ] Política de privacidad visible; consentimiento cuando corresponde.
- [ ] Backups automáticos de la base y prueba de restauración.
- [ ] Registro de acciones de admin (quién cambió qué y cuándo).

---

## 3. Errores típicos de la IA (revisar en cada diff)

1. Clave secreta en el front o en `VITE_*`.
2. Tabla nueva sin RLS, o política `USING (true)`.
3. "Logueado = admin".
4. Validación solo en el navegador.
5. Paquete inexistente o mal escrito (_slopsquatting_).
6. API vieja o deprecada copiada de ejemplos antiguos.
7. `try/catch` que se traga el error, o que muestra el error técnico al usuario.
8. Subida de archivos sin límite de tipo/tamaño.
9. Componentes gigantes que mezclan datos, lógica y diseño.
10. Agregar funcionalidades que nadie pidió.

---

## 4. Perfiles de proyecto

### 4.1 E-commerce chico / catálogo (Amoma)

- Roles: `admin`.
- Público: lee productos publicados. Escribe solo el formulario de contacto (vía Edge Function).
- Pagos (si se agregan): **nunca** procesar tarjetas propias → checkout del proveedor (Mercado Pago). El precio se recalcula en el servidor; **nunca** confiar en el precio que manda el navegador. Confirmación del pago por **webhook firmado**, no por la redirección.

### 4.2 Gimnasio con socios y control de acceso (futuro)

- Roles: `owner`, `staff` (recepción), `coach`, `member`. Cada uno con permisos mínimos.
- Socio: ve solo su ficha, sus pagos, sus reservas.
- **Apto médico / datos de salud = datos sensibles** (Ley 25.326): acceso restringido, registro de quién los consulta, almacenamiento en bucket privado con URLs firmadas de corta duración.
- Acceso por QR: el QR **no** debe ser el ID del socio. Token rotativo de corta vida (tipo TOTP) validado en el servidor, con registro de cada ingreso y bloqueo automático si la cuota está vencida.
- Reservas de clases: control de cupo **en la base** (transacción/constraint), no en el front, para evitar sobreventa.
- Staff con MFA obligatorio; cuentas de empleados que se van se dan de baja el mismo día.

---

## 5. Cómo reutilizar esto

Al terminar Amoma se extrae a una **plantilla** con:

- `docs/security/` (esta guía),
- migraciones base de Supabase (tabla de roles, `is_admin()`/`has_role()`, auditoría),
- tests de permisos,
- `vercel.json` con cabeceras,
- workflow de CI y Dependabot,
- módulo de auth + layout del panel de admin.

Así el próximo proyecto arranca con todo esto resuelto y solo se agrega lo propio del negocio.
