# Amoma — Plan de trabajo para llevar la página a nivel profesional

> Documento vivo. Cada etapa se cierra con una revisión antes de pasar a la siguiente.
> Regla de oro: **una etapa a la vez, cada una con su "listo cuando…" verificable.**

---

## 0. Punto de partida (auditoría del código actual)

Lo que hay hoy (`main`):

- SPA con **Vite + React 19 + React Router 7**, CSS plano, deploy en **Vercel**.
- 3 páginas (Inicio, Galería, Contacto) + 404.
- Contenido **hardcodeado**: las fotos y textos están en el código (`Gallery.jsx`, `Cards.jsx`). Para cambiar un precio o una foto hay que tocar código → por eso hace falta el panel de admin.
- No hay precios ni catálogo de productos.

Problemas detectados (se corrigen en las etapas indicadas):

| #   | Problema                                                                          | Riesgo                                                                                                  | Etapa |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| 1   | El formulario de contacto **no envía nada**: solo hace `console.log` de los datos | Se pierden pedidos de clientes                                                                          | 3     |
| 2   | `console.log` de nombre/email/teléfono del cliente                                | Datos personales en la consola                                                                          | 0     |
| 3   | Script externo de Font Awesome Kit cargado en `index.html`                        | Dependencia de terceros que puede ejecutar código en el sitio (cadena de suministro) y bloquear una CSP | 0     |
| 4   | Sin cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.)                     | Clickjacking, XSS más fácil de explotar                                                                 | 0 / 6 |
| 5   | Imágenes JPEG sin optimizar ni tamaños responsive                                 | Carga lenta en celulares                                                                                | 5     |
| 6   | SPA sin SEO (sin meta tags, sin Open Graph, sin datos estructurados)              | Google no muestra bien el negocio                                                                       | 5     |
| 7   | Modal de galería sin trampa de foco ni cierre con Escape                          | Accesibilidad                                                                                           | 4     |

---

## 1. Decisiones de arquitectura (recomendación)

| Capa         | Elección                                                  | Por qué                                                                                                                                           |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front        | **React + React Router 7** (lo que ya existe)             | No tirar lo hecho. RR7 permite **pre-renderizar** las páginas públicas para SEO sin migrar a otro framework.                                      |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Es lo que usan miles de productos reales; tiene plan gratis; la seguridad se define **en la base de datos** (Row Level Security), no en el front. |
| Hosting      | **Vercel** (ya configurado)                               | Cabeceras de seguridad y deploys por branch.                                                                                                      |
| Validación   | **Zod** (mismo esquema en front y en Edge Functions)      | Nunca confiar solo en la validación del navegador.                                                                                                |
| Animación    | **GSAP + ScrollTrigger** y **Lenis** (scroll suave)       | Estándar de la industria en sitios premiados (Awwwards). GSAP es gratuito incluido sus plugins.                                                   |
| 3D           | **React Three Fiber + drei** (Three.js)                   | Una sola pieza 3D bien hecha, cargada de forma diferida, con imagen de respaldo.                                                                  |
| Íconos       | **lucide-react** (empaquetado, sin scripts externos)      | Reemplaza el kit de Font Awesome.                                                                                                                 |
| Anti-spam    | **Cloudflare Turnstile**                                  | Gratis, sin "elegí los semáforos".                                                                                                                |

**¿Por qué no hacer el backend propio (Express, etc.)?** Para un negocio de este tamaño, un backend propio suma superficie de ataque (servidor que parchear, sesiones que manejar). Supabase resuelve auth, permisos y archivos con piezas auditadas. Lo que nos toca hacer bien es **configurarlo bien**, y ahí es exactamente donde la IA suele fallar (ver sección 3).

---

## 2. Estructura del panel de administración

### Qué tiene que poder hacer la dueña del negocio

1. Entrar con email + contraseña (+ segundo factor opcional, TOTP).
2. **Productos**: crear, editar, ocultar/publicar, ordenar, borrar.
3. **Precios por tamaño/variante** (ej.: "1 kg – 15 porciones – $32.000", "2 kg – 30 porciones – $58.000").
4. **Fotos**: subir varias por producto, elegir la principal, reordenar, borrar, texto alternativo.
5. **Categorías**: Tortas, Postres individuales, Personalizadas, Mesas dulces…
6. **Galería** (trabajos realizados, separada del catálogo).
7. **Consultas recibidas** del formulario: ver, marcar como respondida.
8. **Datos del negocio**: WhatsApp, Instagram, dirección, horarios, aviso tipo "Agenda de diciembre completa".

### Pantallas

```
/admin/login
/admin                 → resumen (consultas nuevas, productos ocultos)
/admin/productos       → listado con filtros, publicar/ocultar
/admin/productos/nuevo
/admin/productos/:id   → datos + variantes/precios + fotos
/admin/categorias
/admin/galeria
/admin/consultas
/admin/ajustes
```

### Modelo de datos (Postgres)

```
categories       id, slug, name, description, sort_order, is_published
products         id, category_id, slug, name, short_description, description,
                 is_published, is_featured, sort_order, created_at, updated_at
product_variants id, product_id, label ("1 kg"), servings, price_cents (entero),
                 is_available, sort_order
product_images   id, product_id, storage_path, alt_text, width, height,
                 is_cover, sort_order
gallery_items    id, storage_path, alt_text, caption, sort_order, is_published
inquiries        id, name, email, phone, reason, message, contact_pref,
                 status ('new'|'answered'|'archived'), created_at
site_settings    id = 1 (fila única): whatsapp, instagram, address, hours, notice
admins           user_id (FK a auth.users)  ← lista blanca explícita
audit_log        id, actor, action, entity, entity_id, at   (opcional)
```

Decisiones importantes:

- **Precios en centavos (entero)**, nunca `float` → evita errores de redondeo.
- **`admins` como lista blanca.** Estar logueado **no** te hace admin.
- Todo cambio de esquema va en **migraciones versionadas** dentro del repo (`supabase/migrations`), nunca "a mano en el panel".

### Permisos (Row Level Security)

| Tabla                                               | Público (anónimo)                      | Admin                              |
| --------------------------------------------------- | -------------------------------------- | ---------------------------------- |
| categories / products / variants / images / gallery | `SELECT` solo si `is_published`        | todo                               |
| inquiries                                           | ninguno (se inserta vía Edge Function) | leer / actualizar                  |
| site_settings                                       | `SELECT`                               | actualizar                         |
| admins                                              | ninguno                                | ninguno (se gestiona solo por SQL) |

Storage: bucket `public-images` → lectura pública; escritura **solo admin**, solo `image/jpeg|png|webp|avif`, máximo ~8 MB.

---

## 3. Errores frecuentes de la IA (y cómo los vamos a evitar)

Datos de contexto: el informe de Veracode 2025 encontró que ~45 % de muestras de código generado por IA fallaban pruebas del OWASP Top 10; un escaneo de Escape.tech sobre 5.600 apps "vibe-coded" publicadas encontró más de 2.000 vulnerabilidades graves, ~400 secretos expuestos y 175 casos de datos personales expuestos. Los fallos más comunes son **control de acceso roto** y **secretos en el código** (que coincide con el puesto #1 del OWASP Top 10:2025: _Broken Access Control_).

### Checklist obligatorio en cada etapa

**Secretos**

- [ ] Ninguna clave secreta en el front. En Vite, **toda variable `VITE_*` es pública** y termina en el JS que descarga cualquiera.
- [ ] La `service_role` key de Supabase **jamás** en el navegador; solo en Edge Functions.
- [ ] `.env` en `.gitignore` y `.env.example` sin valores reales.

**Control de acceso**

- [ ] RLS **activado en todas las tablas** (Supabase lo deja apagado por defecto en tablas nuevas).
- [ ] Nada de políticas `USING (true)` en escritura.
- [ ] No confundir "usuario autenticado" con "admin" → se valida contra la tabla `admins`.
- [ ] **Registro público deshabilitado** en Supabase Auth (si no, cualquiera crea una cuenta).
- [ ] Ocultar un botón en el front **no es seguridad**; la base de datos tiene que rechazar la operación.
- [ ] Test automático que intenta leer/escribir como anónimo y debe fallar.

**Entradas y archivos**

- [ ] Validación con Zod en el servidor, no solo en el formulario.
- [ ] Nada de `dangerouslySetInnerHTML` con contenido cargado por usuarios.
- [ ] Subida de imágenes: validar tipo y tamaño en Storage (no solo por extensión), re-comprimir en el cliente, nombres de archivo generados (UUID), nunca el nombre original.
- [ ] Formulario público con Turnstile + límite de envíos.

**Dependencias (cadena de suministro)**

- [ ] Verificar que cada paquete que propone la IA **existe y es el oficial** (la IA inventa nombres de paquetes; atacantes registran esos nombres: "slopsquatting").
- [ ] `npm audit` + Dependabot.
- [ ] Sin scripts de terceros innecesarios.

**Calidad**

- [ ] Manejo de errores visible (estados de carga, error y vacío en cada pantalla).
- [ ] Componentes chicos y con una responsabilidad.
- [ ] No usar APIs viejas/deprecadas (verificar contra la documentación oficial actual).
- [ ] Sin `console.log` con datos personales.
- [ ] Lint + build + tests pasando antes de cada commit.

### Forma de trabajo

1. **Planificar** la etapa (qué archivos, qué se prueba).
2. **Implementar** en pasos chicos, un commit por paso.
3. **Revisar**: pasada de revisión de código + revisión de seguridad sobre el diff.
4. **Probar**: build, lint, tests y prueba manual en el navegador (capturas).
5. **Cerrar** la etapa con un resumen y esperar tu OK.

---

## 4. Dirección de diseño premium

### Referencias reales para mirar

- **UND NY** (panadería, destacada en Awwwards por sus animaciones de scroll con producto).
- **Ladurée**, **Dominique Ansel**, **Pierre Hermé**: fotografía de producto impecable, mucho aire, tipografía con serif elegante.
- **Lucciano's**: más que efectos, una **marca muy consistente** (colores, packaging, "experiencia"). Lo premium viene primero de la coherencia; los efectos suman encima.
- Colecciones de Awwwards filtradas por _food_ + _scroll_ + _3D_ para ideas de interacción.

### Ideas concretas para Amoma

**Identidad**

- Paleta crema / cacao / un acento (ej. frambuesa o pistacho), definida como _design tokens_.
- Tipografía display con serif expresiva (ej. _Fraunces_ o _Cormorant_) + sans limpia para texto (ej. _Inter_ / _Manrope_), auto-alojadas.
- Microcopy cálido y argentino, coherente con "casero y hecho con amor".

**Hero**

- Torta en **3D** girando suavemente que reacciona al scroll/mouse (React Three Fiber). Requiere un modelo 3D: se puede modelar en Blender o fotogrametría de una torta real. **Plan B** igual de premium y más liviano: video _turntable_ de la torta real en loop.
- Título con animación de letras al entrar.

**Scroll y movimiento**

- Scroll suave (Lenis) + revelado de secciones (GSAP ScrollTrigger).
- Sección "cómo la hacemos" con capas que se arman al scrollear (bizcochuelo → relleno → cobertura).
- Galería con scroll horizontal "pinned" y transición tipo _View Transitions_ al abrir una foto.
- Cinta (_marquee_) de sabores.
- Botones "magnéticos" y cursor personalizado en desktop.
- **Siempre** respetar `prefers-reduced-motion` y degradar en celulares de gama baja.

**Fotografía** (lo que más pesa en "se ve premium")

- Las fotos actuales son de celular con fondos distintos. Recomendación: una sesión con **fondo y luz consistentes** (aunque sea con luz de ventana y un fondo de papel), o retoque de fondos para unificar.
- Servir en AVIF/WebP con varios tamaños y `srcset`.

**Conversión**

- Ficha de producto con selector de tamaño → botón **"Pedir por WhatsApp"** con el mensaje prellenado (producto, tamaño, fecha).
- Aviso de agenda/fechas disponibles editable desde el admin.

---

## 5. Etapas

### Etapa 0 — Fundaciones y limpieza ✅

- [x] Vite actualizado (vulnerabilidad alta del servidor de desarrollo).
- [x] Font Awesome Kit reemplazado por íconos SVG propios (`src/components/Icon.jsx`).
- [x] Google Fonts reemplazado por fuentes auto-alojadas (Fontsource).
- [x] Eliminados los `console.log` con datos de clientes.
- [x] Cabeceras de seguridad en `vercel.json` (CSP estricta, HSTS, anti-framing, etc.), probadas en navegador sin violaciones.
- [x] Prettier + script `npm run check` (lint + formato + build).
- [x] CI en GitHub Actions (lint, formato, build, `npm audit`) + Dependabot.
- [x] Guía de seguridad reutilizable: [`docs/security/SECURITY-BASELINE.md`](security/SECURITY-BASELINE.md).
- Movido a la Etapa 2: reorganizar carpetas (`features/`, `lib/`) cuando existan esas piezas; TypeScript se decide ahí.
- **Listo cuando:** el sitio se ve igual que hoy, sin scripts externos, CI verde.

### Etapa 1 — Base de datos y seguridad de datos

- Proyecto Supabase, migraciones SQL del modelo de la sección 2.
- RLS + políticas + función `is_admin()`; políticas de Storage.
- _Seed_ con los productos y fotos actuales.
- Tests de permisos (anónimo no puede escribir, no-admin no puede escribir).
- **Listo cuando:** los tests de permisos pasan y no hay tablas sin RLS.

### Etapa 2 — Autenticación y panel de admin

- Login, sesión, rutas protegidas, cierre de sesión, MFA opcional.
- CRUD de categorías, productos, variantes/precios, fotos (subida con compresión), galería, ajustes, consultas.
- Validación con Zod, estados de carga/error, confirmación al borrar.
- **Listo cuando:** la dueña puede cargar un producto completo con fotos y precio sin tocar código, y un usuario no-admin no puede hacer nada.

### Etapa 3 — Front público conectado a datos

- Catálogo por categoría, ficha de producto, galería desde la DB.
- Pedido por WhatsApp con mensaje armado.
- Formulario de contacto real: Edge Function + Zod + Turnstile + límite de envíos + aviso por email.
- **Listo cuando:** lo que se carga en el admin aparece en el sitio, y las consultas llegan.

### Etapa 4 — Diseño premium y motion

- Design tokens, tipografías, sistema de componentes.
- Rediseño de cada sección según la sección 4.
- Animaciones (GSAP/Lenis), pieza 3D o video del hero, transiciones.
- Accesibilidad de modales y navegación con teclado.
- **Listo cuando:** se ve premium en desktop y celular, con animaciones fluidas y opción de movimiento reducido.

### Etapa 5 — Performance, SEO y accesibilidad

- Pre-render de páginas públicas, meta tags, Open Graph, `sitemap.xml`, datos estructurados (`Bakery` / `Product` de schema.org).
- Imágenes responsive, carga diferida del 3D, presupuesto de peso.
- **Listo cuando:** Lighthouse ≥ 90 en Performance/Accesibilidad/SEO en celular.

### Etapa 6 — Auditoría final, deploy y operación

- Revisión de seguridad completa contra el checklist + OWASP Top 10:2025.
- CSP definitiva, dominio, backups de la base, monitoreo de errores.
- Guía corta para la dueña: cómo usar el panel.
- **Listo cuando:** checklist completo y sitio en producción.
