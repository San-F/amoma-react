# 04 · Login y cuentas

Regla de oro: **la pantalla decide qué mostrar; la base de datos decide qué se puede hacer.**
Si alguien manipula el front, la base tiene que rechazar igual.

## Qué usamos y por qué

- **Proveedor probado** (Supabase Auth). Nunca login casero ni contraseñas guardadas a mano.
- **Registro público apagado** cuando solo entra staff. Las cuentas se crean **por invitación**.
- **Lista blanca de roles** en una tabla (`admins`, o `staff`/`members`…). Estar logueado ≠ tener permisos.
- **Doble factor obligatorio para administrar**, exigido **en la base**: `is_admin()` pide estar en la
  lista **y** sesión `aal2` (código TOTP). Con la contraseña robada sola no se puede cambiar nada.
- **TOTP (app de códigos) en vez de SMS**: el SMS se roba con un cambio de SIM.

## Flujos (implementados en Amoma)

| Flujo                | Cómo                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ingresar             | email + contraseña (+ Turnstile si está configurado) → si es admin sin MFA → configurar/verificar código               |
| Invitación           | dueño invita desde Supabase → mail con link `/admin/acceso?token_hash=…&type=invite` → crea contraseña → configura MFA |
| Olvidé mi contraseña | mismo mensaje exista o no el email → link `type=recovery` → contraseña nueva                                           |
| Salir                | botón + cierre automático tras 30 min sin uso                                                                          |

Los links usan `token_hash` + `verifyOtp` (funciona aunque el mail se abra en otro dispositivo) y el
token se borra de la barra de direcciones apenas se usa.

## Reglas de contraseñas (NIST SP 800-63B-4)

- **Largo antes que complejidad**: mínimo 15 caracteres si es el único factor. Sin "una mayúscula y un símbolo".
- Sugerir frases ("torta de limón los domingos"). Permitir pegar (gestores de contraseñas).
- Sin vencimiento forzado periódico; cambiar solo si hay sospecha.
- Chequeo contra contraseñas filtradas (en Supabase es del plan pago; compensar con MFA obligatorio).

## Mensajes de error

- "Email o contraseña incorrectos" (nunca "ese email no existe").
- "Demasiados intentos, esperá unos minutos" para el límite de intentos.
- El detalle técnico va a la consola/logs, nunca a la pantalla.

## Configuración en Supabase (checklist)

- [ ] Authentication → Sign In / Providers → Email → **Allow new users to sign up: OFF**.
- [ ] Mínimo de contraseña: **15**.
- [ ] Authentication → URL Configuration: Site URL = dominio real; Redirect URLs solo ese dominio.
- [ ] Email Templates (Invite y Reset Password): link a
      `{{ .SiteURL }}/admin/acceso?token_hash={{ .TokenHash }}&type=invite` (o `type=recovery`).
- [ ] Attack Protection → **CAPTCHA con Cloudflare Turnstile** (secret key acá; site key pública en el front).
- [ ] MFA → TOTP habilitado.
- [ ] La cuenta del **dueño de Supabase** (no la de la app) también con MFA.

## Para un gimnasio (más adelante)

- Socios con login propio → registro abierto **pero** con verificación de email, y RLS `user_id = auth.uid()`.
- Staff y profesores: invitación + MFA obligatorio. Baja de empleados el mismo día.
- Acceso por QR: token rotativo de vida corta validado en el servidor (nunca el ID del socio en el QR).
