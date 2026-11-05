# Reglas de trabajo (leer siempre al empezar)

> Plantilla del "sistema de creación de páginas" de San-F (origen: repo `San-F/amoma-react`).
> Copiar a la raíz del repo nuevo como `CLAUDE.md` y completar "Este proyecto".

Idioma: **español rioplatense** en textos, UI y explicaciones. El usuario no es programador:
explicar en simple, sin jerga, y avisar qué necesita hacer él.

Guía completa: [`docs/playbook/`](docs/playbook/README.md) — leer antes de planificar.
Antes de diseñar: `docs/playbook/13-efectos-premium.md` (efectos para copiar) y `11-lecciones-amoma.md`. Antes de publicar: `12-checklist-calidad.md`.
Plan del proyecto: `docs/PLAN.md` · Pendientes: `docs/PENDIENTES.md` (mantenerlos actualizados).

## Cómo trabajar

1. **Una etapa a la vez**, con "listo cuando…" verificable. No mezclar frentes.
2. Antes de decir "listo": lint + formato + tests + build **mirando el código de salida**, y abrir la
   página en Playwright en **390 px y 1366 px** (+ 320/768/1920 al cerrar etapas): sin scroll lateral,
   sin errores de consola. Animaciones: revisar cuadro por cuadro.
3. Ante cambios de permisos: introducir el error a propósito y ver que el test falla.
4. Commits chicos y explicativos. A `main` solo con OK del usuario.
5. Actualizar `docs/PENDIENTES.md` y el playbook si se aprende algo nuevo.

## Seguridad (no negociable)

- Ningún secreto en el front ni en `VITE_*`. `.env*` ignorado salvo `.env.example`.
- RLS en todas las tablas; permisos cerrados por defecto; nada de `USING (true)` para escribir.
- "Logueado ≠ admin": rol en tabla + MFA (`aal2`) exigido en la base.
- Validar en servidor/base. Errores genéricos al usuario.
- Paquetes: verificar con `npm view` antes de instalar; instalar con `-E`.
- Nunca pedir ni aceptar contraseñas/secret keys por el chat; si el usuario pega una, pedir que la rote.

## Diseño

- Celular primero. Fotos reales del negocio (nunca con marca ajena, banco, IA o Pinterest para productos).
- Contraste AA medido. `prefers-reduced-motion` siempre. Pocas secciones, cada una con propósito.

## Este proyecto

- **[Nombre]**: [rubro, zona, qué vende/ofrece, cómo le llegan los pedidos].
- Stack: [ej. React + Vite + React Router · Supabase · Cloudflare Pages] · planes gratis sin tarjeta.
- Comandos: [dev, check, tests].
