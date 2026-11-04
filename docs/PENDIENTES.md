# Pendientes

Lista viva. ✅ = hecho · ⏳ = en curso · 🔲 = falta

## Para vos (Francisco)

### Cuando estés en casa (la red del trabajo bloquea Supabase)

- 🔲 Pasarme la **Project URL** y la **publishable key** de Supabase (son públicas).
  ❌ Nunca la secret key ni la contraseña de la base.
- 🔲 Confirmar que la contraseña de la base es la **nueva** y está guardada en un gestor de contraseñas.
- 🔲 Crear cuenta gratis en **Cloudflare** y conectar el repo `amoma-react` en Pages
  (build: `npm run build`, salida: `dist`). No hacer deploy hasta que te avise.

### Configurar Supabase (te guío paso a paso cuando llegue el momento)

- 🔲 Pegar las migraciones y el seed en el **SQL Editor** (ver `supabase/README.md`).
- 🔲 **Desactivar el registro público** (Authentication → Sign In / Providers → Email).
- 🔲 Cambiar los **mails de invitación y de recuperar contraseña** (te paso el texto).
- 🔲 Invitar a la dueña y hacerla admin.
- 🔲 Revisar el **Security Advisor** (sin alertas críticas).

### GitHub (mantenimiento automático)

- 🔲 Cargar Variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `BACKUPS_ENABLED=true`.
- 🔲 Cargar Secrets: `SUPABASE_DB_URL` (Session pooler), `BACKUP_PASSPHRASE`.

### Con la clienta (dueña de Amoma)

- 🔲 Que instale una app de códigos (Google Authenticator, Microsoft Authenticator o similar) para el doble factor.
- 🔲 Lista de productos con **tamaños y precios** reales.
- 🔲 Sabores para **"Armá tu torta"**: bizcochuelos, rellenos, coberturas, decoraciones (y si alguno suma precio).
- 🔲 Fotos: idealmente una sesión con **misma luz y mismo fondo**. Guardar siempre los originales.
- 🔲 Horarios, zona de entrega y anticipación mínima para pedidos.
- 🔲 Testimonios **reales** (con permiso) si quiere mostrarlos.
- 🔲 Decidir si quiere dominio propio (`amoma.com.ar`, se paga por año en NIC Argentina) o usar el gratis de Cloudflare.

## Para mí (Claude)

- ✅ Etapa 0 — Fundaciones y seguridad base
- ✅ Etapa 1 — Base de datos, permisos y 60 tests
- ⏳ Etapa 2 — Panel de admin (login + doble factor + productos/precios/fotos)
- 🔲 Etapa 2 — Categorías, galería, ajustes y consultas en el panel
- 🔲 Conectar con Supabase real y probar de punta a punta (necesita las claves)
- 🔲 Mudanza a Cloudflare Pages (archivos ya listos: `public/_headers`, `public/_redirects`)
- 🔲 Etapa 3 — Sitio público conectado + formulario real con anti-spam
- 🔲 Etapa 4 — Diseño premium ("Armá tu torta", 5 secciones, celular primero)
- 🔲 Etapa 5 — Velocidad, Google y accesibilidad
- 🔲 Etapa 6 — Auditoría final, publicación y guía de uso para la dueña
- 🔲 Al final: extraer la **plantilla reutilizable** (login, permisos, panel, seguridad) para el próximo proyecto (gimnasio)
