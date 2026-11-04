# Auditoría de seguridad

**Fecha:** 4/11/2026 · **Alcance:** código del repo (sitio, panel, base de datos, CI).
**Estado:** el código está revisado. Falta verificar la **configuración real** de Supabase y del hosting
(ver la sección final) cuando estén creadas las cuentas.

## Chequeos automáticos

| Chequeo                                                        | Resultado                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| `npm audit` (dependencias)                                     | 0 vulnerabilidades                                         |
| Claves secretas en el código y en **todo el historial** de git | Ninguna                                                    |
| Tests de permisos (`npm run test:db`)                          | 88/88 OK; verificado que fallan si se introduce el error   |
| Tests unitarios (`npm run test:unit`)                          | 13/13 OK                                                   |
| Accesibilidad (axe-core) en todas las páginas                  | 0 errores                                                  |
| `dangerouslySetInnerHTML`, `eval`, `console.log` con datos     | Ninguno                                                    |
| Links externos sin `noopener noreferrer`                       | Ninguno                                                    |
| Variables expuestas al navegador                               | Solo públicas: URL, publishable key, site key de Turnstile |

## OWASP Top 10:2025

| Riesgo                                      | Cómo está cubierto                                                                                                                                                                                                                                                     | Estado                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **A01 Control de acceso roto**              | RLS en todas las tablas; permisos revocados por defecto (también para tablas futuras); `is_admin()` = lista blanca + doble factor (`aal2`); el público solo escribe por `submit_inquiry`; bucket sin listado; tests para anónimo, usuario común, admin sin MFA y admin | ✅                                       |
| **A02 Configuración insegura**              | CSP estricta (solo propio + Supabase + Turnstile), HSTS, anti-framing, `nosniff`, Referrer y Permissions Policy; `/admin` con `noindex` y `no-store`                                                                                                                   | ✅ (verificar en producción)             |
| **A03 Cadena de suministro**                | Sin scripts de terceros salvo Turnstile; versiones fijas con lockfile; paquetes verificados antes de instalar; `npm audit` en CI; Dependabot; se evitó `xlsx` (vulnerable)                                                                                             | ✅                                       |
| **A04 Fallas criptográficas**               | Contraseñas las maneja Supabase Auth; HTTPS obligatorio (HSTS); backups encriptados AES-256; IP guardada solo como hash                                                                                                                                                | ✅                                       |
| **A05 Inyección**                           | Consultas con la librería oficial (parametrizadas); funciones SQL con `search_path = ''`; React escapa todo el texto; sin HTML inyectado                                                                                                                               | ✅                                       |
| **A06 Diseño inseguro**                     | Importación todo-o-nada; precios en centavos; validación en base + front; límites de tamaño y tipo de archivo en el servidor                                                                                                                                           | ✅                                       |
| **A07 Fallas de autenticación**             | Registro público apagado (a configurar); invitación; contraseñas ≥ 15; MFA TOTP obligatorio; cierre por inactividad; mensajes genéricos; Turnstile opcional                                                                                                            | ✅ (configurar)                          |
| **A08 Integridad de software/datos**        | CI obligatorio; migraciones versionadas; auditoría de cambios (`audit_log`)                                                                                                                                                                                            | ✅                                       |
| **A09 Registro y alertas**                  | `audit_log` de cambios de admin; errores técnicos solo en consola del admin                                                                                                                                                                                            | ⚠️ sin alertas automáticas (plan gratis) |
| **A10 Manejo de condiciones excepcionales** | Estados de carga/error/vacío en todas las pantallas; el sitio usa contenido fijo si la base falla; el formulario ofrece WhatsApp si falla                                                                                                                              | ✅                                       |

## Riesgos que quedan (aceptados o a resolver)

| Riesgo                                                             | Gravedad | Detalle / mitigación                                                                                                                                                    |
| ------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesión del panel guardada en el navegador (`localStorage`)         | Baja     | Es el estándar de Supabase en sitios sin servidor. Lo que la protege es la CSP estricta (impide scripts ajenos) y el doble factor.                                      |
| Tope global de 200 consultas/día                                   | Baja     | Alguien con muchas IPs podría agotarlo y bloquear el formulario por un día. El formulario ofrece WhatsApp en ese caso. Activar Turnstile en el formulario lo reduciría. |
| Sin aviso por email de consultas nuevas                            | Baja     | Hoy se ven en el panel. Para avisar por mail hace falta configurar un servicio de envío.                                                                                |
| Sin detección de contraseñas filtradas                             | Baja     | Es del plan pago de Supabase. Compensado con MFA obligatorio.                                                                                                           |
| Contraseña de la base pegada en el chat (ya rotada según el dueño) | —        | Confirmar que la actual es otra. No quedó en el repo (verificado en todo el historial).                                                                                 |

## Verificar cuando esté todo configurado (checklist)

- [ ] Supabase **Security Advisor** sin alertas críticas.
- [ ] Registro público **apagado**; mínimo de contraseña 15; MFA TOTP habilitado.
- [ ] Intentar crearse una cuenta desde la página → tiene que fallar.
- [ ] Con la cuenta de la dueña **sin** el código de 6 dígitos → no puede guardar cambios.
- [ ] Probar el formulario de contacto 4 veces seguidas → la cuarta se frena.
- [ ] **securityheaders.com** y **Mozilla Observatory** sobre el dominio publicado → nota A.
- [ ] Correr el backup a mano una vez y **restaurarlo** en una base de prueba.
- [ ] La cuenta de Supabase, Cloudflare, GitHub y el dominio con doble factor.
