# Amoma · Pastelería casera

Página web y panel de administración de **Amoma**, pastelería casera en Villa Pueyrredón (CABA).

- **Sitio público**: portada, categorías, catálogo con detalle y precios, tortas personalizadas,
  cómo pedir, galería, contacto y privacidad. Los pedidos salen por WhatsApp con el mensaje armado.
- **Panel `/admin`**: la dueña carga productos, precios por tamaño y fotos (o todo desde un **Excel**),
  categorías, datos del negocio y un aviso destacado. Login con **doble factor obligatorio**.

## Tecnologías

React 19 · Vite · React Router 7 · Supabase (Postgres + Auth + Storage) · Cloudflare Pages / Vercel ·
GitHub Actions. Todo funciona con planes **gratis**.

## Desarrollo

```bash
npm install
```

```bash
npm run dev
```

Sin configurar Supabase, el sitio usa el contenido fijo de `src/data/catalog.js`. Para conectarlo,
copiar `.env.example` a `.env.local` y completar las dos claves públicas (ver `supabase/README.md`).

| Comando             | Qué hace                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| `npm run check`     | lint + formato + tests unitarios + build (lo mismo que el CI)               |
| `npm run test:unit` | tests de precios, slugs y lectura de Excel                                  |
| `npm run test:db`   | migraciones + 73 tests que intentan romper los permisos (necesita Postgres) |

## Documentación

- [`docs/PLAN.md`](docs/PLAN.md) — plan por etapas
- [`docs/PENDIENTES.md`](docs/PENDIENTES.md) — qué falta (del cliente y del código)
- [`docs/DESIGN.md`](docs/DESIGN.md) — dirección de diseño
- [`docs/playbook/`](docs/playbook/README.md) — guía reutilizable para futuros proyectos
- [`supabase/README.md`](supabase/README.md) — base de datos, configuración y backups
- [`CLAUDE.md`](CLAUDE.md) — reglas de trabajo que Claude lee al empezar
