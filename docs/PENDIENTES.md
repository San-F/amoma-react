# Pendientes

Lista viva. ✅ = hecho · ⏳ = en curso · 🔲 = falta

## Dónde quedamos (12/11/2026) — leer esto primero en un chat nuevo

**Base real (Supabase):** proyecto "Amoma" de Francisco.
Project URL `https://qadtxsgsurfcmtrzopcu.supabase.co` · publishable key
`sb_publishable_UiLdLhxtLBmkI0in9cQLzg_KUmPyCX0` (las dos son públicas).
Para que Claude pueda llegar a la base y al sitio desde la nube, la sesión tiene que usar el entorno **"amoma-web"**.
Ese entorno guarda un **token de Supabase** (solo proyecto Amoma; Database lectura y escritura, el resto solo lectura; **vence el 10/2/2027**). Claude lo usa por `https://api.supabase.com/v1/projects/qadtxsgsurfcmtrzopcu/database/query` sin verlo. Al entregar a la clienta: borrarlo en Supabase → Account → Access Tokens.

| Paso del alta (guía: `web-plantilla/docs/proceso/alta-supabase.md`)                      | Estado                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------- |
| Tablas y permisos (`supabase/puesta-en-marcha.sql`)                                      | ✅ comprobado desde afuera          |
| Registro público apagado                                                                 | ✅ comprobado desde afuera          |
| Contraseña mínima de 15 (Sign In / Providers → bajar → Email)                            | ✅ (11/11)                          |
| Dirección del sitio (URL Configuration): `https://amoma-1gq.pages.dev`                   | ✅ comprobado por API (12/11)       |
| Links de los mails (Emails → Templates): **bloqueado sin SMTP propio**                   | 🔲 ver nota abajo                   |
| Doble factor TOTP habilitado (Multi-Factor)                                              | ✅ (12/11)                          |
| Francisco primer admin: **crear usuario a mano** (sin mail) + `admins`                   | ✅ ingresó con doble factor (12/11) |
| Variables públicas en el hosting y en GitHub (base despierta, backup)                    | 🔲                                  |
| Carga inicial: 8 productos (20 tamaños) + 10 fotos de galería, iguales a los de respaldo | ✅ (12/11)                          |
| Probar el panel de punta a punta contra la base real                                     | 🔲                                  |

Comprobación: `bash scripts/comprobar-base.sh <URL> <key>` (está en `web-plantilla/scripts/`): hoy pasa los 16 controles.

**Mails (12/11):** desde el 3/6/2026 los proyectos gratis nuevos **no pueden editar las plantillas** de
mail sin SMTP propio, y sin SMTP propio Supabase solo manda mails a miembros de la organización (2 por
hora). Por eso: Francisco se crea su usuario a mano (Users → Add user → Create new user, con auto
confirmación) y no hace falta mail. **Antes de dar de alta a la dueña** hay que resolver el link del mail (no la cantidad):
SMTP gratis o adaptar el panel al link por defecto. Con SMTP gratis (Brevo, Resend, etc.: verificar límites en la fuente oficial) se pueden cambiar las plantillas
(links con `token_hash`, ver `supabase/README.md`) y pasarlas a español. Fuentes:
<https://supabase.com/docs/guides/auth/auth-smtp> y
<https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier>.

**Mudanza a Cloudflare** ✅ publicado el 12/11 en `https://amoma-1gq.pages.dev` (Pages, con las dos
variables). Comprobado: rutas, cabeceras de seguridad, `/admin` sin indexar, lee productos de la base
real, sin scroll lateral en 390/1366. Detalle: una fuente chica viene incrustada (`data:`) y la regla
`font-src 'self'` la bloquea (pasaba igual en Vercel); arreglar aparte. Falta: actualizar la dirección en
`index.html`, `sitemap.xml`, `robots.txt` y `llms.txt`, y bajar Vercel. Cómo se hizo:
Francisco ya creó la cuenta y autorizó solo el repo `amoma-react`. Se usa **Pages** (el repo ya trae
`public/_headers` y `public/_redirects`): Compute → Workers & Pages → Create → _Get started with Pages_ →
**Import an existing Git repository**. Valores: rama `main` · preset Vite · build `npm run build` ·
salida `dist` · variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
Después: comprobar rutas y cabeceras en la dirección nueva, cambiar la dirección en Supabase, y recién
entonces sacar el sitio de Vercel y actualizar la dirección en `index.html`, `sitemap.xml`, `robots.txt` y `llms.txt`.
(El camino "Workers" también se probó en local y funciona con un `wrangler.jsonc`; queda como alternativa.)

**Seguridad de las cuentas de Francisco:** lista en `web-plantilla/docs/para-francisco.md` (gestor de
contraseñas, doble factor empezando por el mail, FileVault). 🔲 pendiente de confirmar.

**Plantilla (`San-F/web-plantilla`):** tanda 1 lista; la tanda 2 espera a que el panel de Amoma esté
probado contra la base real. Ver su `PROGRESO.md`.

## Auditoría del 13/11/2026

Resultado completo y orden de arreglos: [`AUDITORIA-2026-11-13.md`](AUDITORIA-2026-11-13.md)
(9 importantes, 10 medios). Nada grave de seguridad; lo importante es de funcionamiento.

**Publicado el 13/11:** los arreglos de la auditoría (migración `20261113001000_guardar_e_importar.sql`
aplicada en la base real con copia previa; página y panel en `main`). Comprobado desde afuera: 8 productos,
10 fotos, base cerrada. **Falta la prueba de Francisco en el panel real** (cambiar un precio, "+ Foto",
ocultar, Excel). **Próximo:** panel v2 desde las maquetas (ingreso → Inicio/Productos → Publicar → Fotos).

**Maquetas del panel v2** (`docs/maquetas/panel-v2/`): aprobadas por Francisco el 13/11 con dos cambios:
(1) en el **ingreso, sin la foto de la torta** (dejar logo + "Hola de nuevo"); (2) en **Publicar**, cuidar
la proporción del logo (en una miniatura salió estirado). Mantener los dos modelos (Vitrina y Portada) y,
a lo sumo, **sumar un tercero**; no sacar ninguno.

**Categorías (decisión de Francisco, 13/11, reemplaza lo anterior):** las 4 tarjetas son fijas y sus
fotos también; la dueña cambia **solo el nombre** (máx. 30 letras) desde Productos → "Nombres de las
categorías", y se ve en la tarjeta de la portada y en el filtro del catálogo. Migración
`20261113001100_nombre_categorias.sql`.

**Panel v2 programado (13/11):** 4 secciones (Inicio, Productos, Fotos, Publicar) + engranaje (Ajustes,
Consultas, Salir); ingreso con logo y "Hola de nuevo"; pestaña "Panel Amoma"; ficha con una foto
(elegir una ya cargada o subir), "Sumar a la galería", sin "Destacado"; Fotos como feed; Publicar con
Vitrina/Portada × crema/chocolate × cuadrado/historia, descarga JPG 1080 px. Archivos compartidos: se
borran solo si nadie más los usa. Prueba "un día de la dueña" ampliada. Pendiente: tercer modelo de
publicación (opcional), "Sin stock", portada del sitio editable, códigos de respaldo del doble factor.

**Excel (13/11, pedidos de Francisco):** planilla .xlsx prolija (encabezado de color fijo, franjas por
producto, precios con formato, hoja "Cómo usar"); "Descargar mi catálogo" y "Planilla vacía con
ejemplos" (los ejemplos se ignoran); botón "Excel" a la vista en Productos; **código de número** por
producto (lo asigna la base, no cambia nunca: migración `20261113001200_codigo_productos.sql`, falta
aplicarla en la base real con OK); **desplegables** en Categoría (con los nombres actuales de las
4 tarjetas al momento de descargar) y en Publicado (sí/no). Pruebas: `tests/planilla.test.js` (19 casos) + base + navegador de
punta a punta (bajar, editar, guardar .xlsx, subir, volver a bajar, código tocado, planilla vacía).

**Salir (13/11):** cerraba la sesión en todos los dispositivos (por eso el celular volvía a pedir
contraseña y código). Ahora cierra solo el dispositivo donde se toca, con prueba de navegador.
Revisado en la base real: las sesiones no vencen solas (sin límite de tiempo ni de inactividad).

**Galería en Safari: confirmado arreglado por Francisco (13/11).**

**Para publicar todo junto (13/11, pedido de Francisco):**

- Galería en Safari (Mac): la página seguía mucho más abajo del pie. Causa probable: grilla en columnas +
  fotos agrandadas del efecto "descubrir". Arreglo en la rama (`overflow: hidden` + `contain: paint` en
  `.galeria__grid`). **No se pudo probar en Safari acá**: confirmarlo en el Safari de Francisco al publicar.

**Fotos de producto en el panel v2 (pedidos de Francisco, 13/11):**

- Al poner la foto de un producto: **elegir una ya cargada** (de la galería o de otro producto) **o subir
  una nueva**. Ojo al borrar: un archivo usado en dos lugares no se borra del almacenamiento mientras
  algo lo siga usando (hoy borrar un producto borra sus archivos).
- Botón **"Sumar también a la galería"** en la foto de un producto (sin subirla dos veces).
- Al subir: aviso claro **"Foto subida ✓"**; acomodarla en el círculo es opcional.
- Sacar **"Destacado"** (no se usa en la página); para resaltar está la Etiqueta.

**Galería (decisión de Francisco, 13/11):** se queda como está (fotos completas y grandes; ahí van también
las tortas personalizadas). En el panel nuevo, "Fotos" se maneja como un feed: grilla, tocar una foto para
**mostrarla u ocultarla**, ordenar y borrar (mostrar/ocultar y ordenar ya existen hoy). En "Publicar", la
foto de una publicación **no** va sola a la galería: casilla opcional "Sumar también a la galería"
(apagada por defecto). A evaluar: botón "Sumar a la galería" desde la foto de un producto.

## Para vos (Francisco)

### Cuando estés en casa

- 🔲 Pasarme la **Project URL** y la **publishable key** de Supabase (son públicas).
  ❌ Nunca la secret key ni la contraseña de la base.
- 🔲 Seguir la **puesta en marcha** de [`supabase/README.md`](../supabase/README.md) (te guío paso a paso):
  migraciones, registro apagado, mails de invitación, invitar a la dueña.
- 🔲 Cargar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en Vercel (o Cloudflare) y redeploy.
- 🔲 Crear cuenta gratis en **Cloudflare**: Pages (mudanza) + Turnstile (anti-robots del login).
- 🔲 GitHub → Variables y Secrets para keepalive y backups (ver `supabase/README.md`).

### Con la clienta (dueña de Amoma)

- 🔲 Instalar **Google Authenticator** o **Microsoft Authenticator** (doble factor del panel).
- 🔲 Lista de productos con **tamaños, porciones y precios** → la cargamos con la **planilla Excel** del panel.
- 🔲 Confirmar descripciones de las tortas (las actuales son de ejemplo).
- 🔲 ¿Hace **envíos** o solo retiro? (se menciona en "Cómo pedir").
- 🔲 Horarios y anticipación mínima para pedidos (hoy el formulario pide 3 días para personalizadas).
- 🔲 Fotos nuevas con **misma luz y mismo fondo**. Guardar siempre los originales.
- 🔲 Revisar el texto de **Privacidad**.
- 🔲 Testimonios **reales** (con permiso) si quiere mostrarlos.
- 🔲 ¿Dominio propio (`amoma.com.ar`, pago anual en NIC Argentina) o el gratis?
- 🔲 Leer juntos [`docs/playbook/06-fraudes.md`](playbook/06-fraudes.md) (comprobantes falsos, phishing).

## Para mí (Claude)

- ✅ Etapa 0 — Fundaciones y seguridad base
- ✅ Etapa 1 — Base de datos, permisos (88 tests), importación desde Excel en la base
- ✅ Etapa 2 — Panel de admin: login, doble factor, invitación/recuperación, productos, precios,
  fotos, Excel, categorías, consultas, ajustes (probado con Supabase simulado)
- ✅ Etapa 3 — El sitio lee productos, precios y ajustes de la base (con respaldo fijo) + aviso destacado
- ✅ Etapa 4 — Front premium v2 (portada elegida por la clienta, categorías, catálogo estilo Lucciano's,
  personalizada animada, cómo pedir)
- ✅ Etapa 5 — Google y compartir (OG, schema.org, sitemap), accesibilidad (axe sin errores), privacidad
- ✅ Playbook reutilizable + `CLAUDE.md`
- ✅ "Tu pedido": varios productos en un solo WhatsApp. En el detalle: tamaño con porciones y precio, cantidad, total en vivo, "Agregar y seguir" o "Pedir ahora". En la hoja: cambiar tamaño (si queda repetido se junta), cantidad, quitar con "Deshacer", precio siempre del catálogo actual, avisos si algo ya no está. Fondo quieto con ventanas abiertas. Probado con 5.000 toques al azar + navegador en celular y compu.
- ✅ Imagen para compartir (`public/og-8.jpg`, se rehace con `node scripts/og.cjs`): porción de torta de chocolate (foto de la tarjeta "Tortas") **grande, casi toda la imagen**, con la misma foto desenfocada de fondo y el **logo real** de Amoma en rosa, sin fondo blanco, apoyado abajo al centro de la foto. Nada en los costados (WhatsApp los recorta). Título y descripciones **con "Villa Pueyrredón, CABA"** (Google).
- ✅ **Precios de referencia visibles** en la página (estimados para pastelería casera de CABA, nov. 2026; ver `src/data/catalog.js`). Se quitó el modo `?precios=demo`.
- 🔲 Que la dueña **revise y corrija los precios** en el panel o con la planilla Excel (los de ahora son estimados: torta chica $28.000, lemon pie chico $19.000, docena de chipá $9.000, etc.).
- ✅ **Acomodar la foto** en el panel: al subirla (o tocándola después) se mueve y acerca dentro del círculo, viendo cómo queda en la tarjeta. Se guarda en la base (`focus_x`, `focus_y`, `zoom`, con límites que controla la base y tests de permisos). La Charlotte ya quedó centrada.
- 🔲 Ideas para el panel: encuadre también en la **Galería**; **ordenar productos** arrastrando; **duplicar** un producto; marcar **"sin stock"** por unos días.
- 🔲 **"Crear publicación"** (panel, sección nueva): la dueña carga una foto, elige formato (cuadrado / historia) y una plantilla con la estética de la marca, edita texto y precio, y **descarga** la imagen para subir a Instagram. Sin conexiones a Instagram/Meta ni servicios externos; la foto de la publicación **no se guarda** (se arma en el celular). Opcional: partir de una foto ya subida al catálogo (trae nombre y precio). Diseño **aprobado** (maquetas del 11/11): 2 modelos, "Vitrina" (foto en círculo, texto abajo) y "Portada" (foto grande, franja con nombre y precio en pastilla), cada uno en 2 colores intercambiables (crema / chocolate) y 2 formatos (cuadrado / historia). Nombre en dos renglones con el segundo en cursiva rosa; "desde $" discreto; logo chico. Va después de conectar la base real. Pensado como módulo opcional de la plantilla.
- 🔲 Conectar con Supabase real y probar de punta a punta (necesita las claves)
- ✅ Formulario de contacto guarda las consultas en el panel (límite de envíos + trampa para robots,
  sin guardar IPs); si falla, ofrece WhatsApp. Sin base conectada sigue abriendo WhatsApp
- ✅ Galería administrable desde el panel (subir, describir, ordenar, ocultar, borrar)
- 🔲 **Sesión del panel: una vez por dispositivo** (decisión de Francisco, 12/11): sacar el cierre por inactividad de 30 min (`INACTIVIDAD_MS` en `src/admin/auth.jsx`). En el plan gratis las sesiones de Supabase no vencen solas (<https://supabase.com/docs/guides/auth/sessions>), así que queda abierta hasta tocar "Salir"; en un dispositivo nuevo pide contraseña + código. Recomendar a la dueña bloqueo en el celular. Hacerlo después de probar el ingreso real y llevarlo a la plantilla.
- 🔲 Opción **"Cambiar mi contraseña"** dentro del panel (hoy solo se puede por el mail de recuperación). Permite crear la cuenta del cliente a mano y que él la cambie al entrar, sin depender del mail. Llevarla también a la plantilla.
- 🔲 Aviso por email a la dueña cuando entra una consulta (necesita configurar un servicio de mails;
  hoy las ve en el panel → Resumen)
- ⏳ **Categorías: las 4 fijas** — hecho en la rama (12/11): sección sacada del panel y migración `20261112000900_categorias_fijas.sql` (la base no deja crear, borrar ni ocultar; solo cambiar nombre y descripción; tests + caso malo comprobado). Falta: aplicarla en la base real y publicar, con OK de Francisco. Después, en el rediseño: editar nombre y foto de las 4 y que la portada y los filtros los tomen de la base. Resto de la nota original: (decisión de Francisco, 12/11). Hoy el panel deja crear categorías y cambiarles el nombre, pero la portada y los filtros salen fijos de `src/data/catalog.js`: una categoría nueva no rompe nada pero sus productos solo aparecen en "Todas", y cambiar un nombre en el panel no cambia la página. Hacer: sacar "Nueva categoría" del panel (y que la base no permita crear ni borrar: permiso + test); dejar editar **solo nombre y foto** de las 4, y que la portada y los filtros tomen ese nombre y esa foto de la base (con el respaldo fijo si falla). Llevarlo a la plantilla como criterio: el panel solo cambia lo que el diseño soporta.
- 🔲 Mudanza a Cloudflare Pages (archivos ya listos: `public/_headers`, `public/_redirects`)
- 🔲 Medir con Lighthouse en el sitio publicado
- ✅ Guía de uso del panel para la dueña, con capturas: [`docs/GUIA-PANEL.md`](GUIA-PANEL.md)
- ✅ Auditoría de seguridad del código: [`docs/AUDITORIA.md`](AUDITORIA.md) (OWASP Top 10:2025)
- 🔲 Etapa 6 — Verificar la configuración real con el checklist de la auditoría
- 🔲 Al final: extraer la **plantilla** a un repo propio para el próximo proyecto (gimnasio)
