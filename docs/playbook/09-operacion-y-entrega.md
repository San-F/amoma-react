# 09 · Publicar, operar y entregar

## Stack gratis (sin tarjeta) que usamos

| Pieza                  | Servicio                                     | Ojo con                                                         |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Hosting                | **Cloudflare Pages** (permite uso comercial) | Vercel Hobby es solo uso personal                               |
| Base, login, fotos     | **Supabase Free**                            | Pausa a los 7 días sin uso; sin backups; 2 proyectos activos    |
| Anti-robots            | **Cloudflare Turnstile**                     | —                                                               |
| CI, backups, keepalive | **GitHub Actions**                           | Los cron se apagan tras 60 días sin actividad en repos públicos |
| Dominio                | NIC Argentina (`.com.ar`)                    | Único costo: renovación anual                                   |

## Dominio y mails

- Dominio a nombre **del cliente**, con renovación automática y su mail de contacto.
- DNS en Cloudflare (gratis). Si se usan mails con el dominio: configurar **SPF, DKIM y DMARC**
  (evita que otros manden mails "como" el negocio y que los propios caigan en spam).
- Cambiar canonical, sitemap, OG y Site URL de Supabase al dominio final.

## Antes de publicar (checklist)

- [ ] `npm run check` y `npm run test:db` en verde; CI verde.
- [ ] axe sin errores; Lighthouse ≥ 90 en celular.
- [ ] Cabeceras: nota A en securityheaders.com / Mozilla Observatory.
- [ ] Supabase Security Advisor sin alertas críticas.
- [ ] Registro público apagado; MFA del admin configurado; Turnstile activo.
- [ ] Backups funcionando (correr el workflow a mano una vez y **probar restaurar**).
- [ ] Textos legales revisados (privacidad).
- [ ] Datos de ejemplo reemplazados por los reales (precios, sabores, zona de entrega).

## Entrega al cliente

- Guía corta con capturas: cómo entrar, cargar un producto, usar el Excel, cambiar el aviso.
- Sus accesos (y el doble factor) los configura **el cliente** en su celular.
- Explicarle [06-fraudes.md](06-fraudes.md): comprobantes falsos, phishing, nunca compartir códigos.
- Quién es dueño de qué: dominio, cuenta de Supabase, Cloudflare y GitHub idealmente a su nombre
  (o con él como dueño y vos como colaborador).

## Si algo sale mal (incidentes)

1. **Clave filtrada**: rotarla ya (Supabase → API keys / contraseña de la base), revisar logs.
2. **Cuenta comprometida**: cerrar sesiones, cambiar contraseña, re-configurar MFA, revisar `audit_log`.
3. **Datos borrados**: restaurar el último backup (`gpg -d` + `psql`).
4. **Sitio caído**: revisar el último deploy y volver al anterior (rollback en Cloudflare/Vercel).
5. Anotar qué pasó y qué se cambia para que no vuelva a pasar.
