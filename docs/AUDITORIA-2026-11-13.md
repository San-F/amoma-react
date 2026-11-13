# Auditoría completa · 13/11/2026

Qué se miró: todo el código de la base (migraciones, permisos, funciones), el panel, la página pública,
las tareas automáticas, y el **estado real** de la base y del sitio publicado
(`https://amoma-1gq.pages.dev`), recorrido como cliente en un celular. La base real se consultó solo en
modo lectura. La auditoría anterior (código, OWASP) está en [`AUDITORIA.md`](AUDITORIA.md).

## Lo que está bien (comprobado)

- Todas las tablas tienen permisos por fila activados; un visitante solo puede **leer** el catálogo y
  **enviar una consulta**. Nada más. (Consultado en la base real.)
- Ser administrador exige estar en la lista **y** el código del celular; lo decide la base, no la pantalla.
- Registro público apagado, contraseña mínima de 15, doble factor activo, direcciones bien configuradas.
- Fotos: solo un administrador sube/borra; tipo y tamaño limitados en el servidor; no hay fotos sueltas (18 de 18 en uso).
- Cabeceras de seguridad activas en el sitio; el panel no lo indexa Google; el código del panel no se
  descarga para el público.
- Sin llaves secretas en el código; dependencias sin vulnerabilidades conocidas (`npm audit`: 0).
- Mensajes de error genéricos (login incorrecto no revela si el mail existe).
- Recorrido de cliente en celular: abre producto, arma el pedido y el WhatsApp sale bien escrito.

## Problemas encontrados

### Importantes (arreglar antes de entregar a la dueña)

| #   | Problema                                                                                                                                                                                                                                     | Dónde                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| A1  | **Si la base queda sin productos (o sin fotos de galería), la página vuelve a mostrar los de muestra**, con precios estimados. Pasa si la dueña oculta o borra todo. El respaldo debería usarse solo si la base **falla**, no si está vacía. | `src/lib/sitio.js`                    |
| A2  | **Un producto "Visible" sin foto no aparece en la página y nadie avisa.** El panel lo muestra como publicado.                                                                                                                                | `src/lib/sitio.js`, panel             |
| A3  | **Excel vuelve a mostrar productos ocultos**: si la columna "publicado" queda vacía, el producto se publica. También reordena los productos y, si se cambia la foto, la vieja queda guardada.                                                | `importer.js`, `admin_import_catalog` |
| A4  | **El Excel no se puede bajar con lo que ya está cargado**: la planilla modelo trae 3 filas de ejemplo. Para cambiar precios hay que escribir todo de nuevo.                                                                                  | `Importar.jsx`                        |
| A5  | **Guardar un producto no es "todo o nada"**: guarda el producto, borra los precios y los vuelve a cargar en 3 pasos. Si se corta en el medio, queda sin precios.                                                                             | `guardarProducto` en `api.js`         |
| A6  | **Recuperar contraseña no funciona para quien ya tiene doble factor** (Supabase exige el código antes de cambiarla) y además el link del mail hoy no abre el panel (plantillas bloqueadas sin SMTP).                                         | `Acceso.jsx`, `Login.jsx`             |
| A7  | **Las consultas del formulario no avisan a nadie**: al cliente le dice "te escribimos muy pronto", pero la dueña solo se entera si entra al panel.                                                                                           | `Contact.jsx`, panel                  |
| A8  | **No hay backups ni "base despierta" funcionando**: los archivos están, pero faltan las variables en GitHub. El backup además no incluye las fotos.                                                                                          | `.github/workflows/`                  |
| A9  | **Si la dueña pierde el celular, queda afuera**: no hay códigos de respaldo ni un procedimiento escrito para recuperarla.                                                                                                                    | `Seguridad.jsx`, guía                 |

### Medios

| #   | Problema                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Algunos "Guardado ✓" pueden mentir: si la base rechaza el cambio sin dar error (0 filas), el panel igual dice que guardó. Solo el encuadre lo controla.                                                  |
| M2  | Cambiar el nombre de un producto cambia su identificador: el Excel con el nombre viejo crea un duplicado y los pedidos a medio armar de los clientes lo pierden.                                         |
| M3  | Desde la lista se puede poner "Visible" un producto sin precios (el formulario lo impide, el interruptor no).                                                                                            |
| M4  | Ajustes sin validar: Instagram con "@" o con la dirección completa rompe el enlace; el mail no se controla.                                                                                              |
| M5  | Las consultas (datos personales) no se pueden borrar desde el panel ni se borran solas; conviene un plazo (ej. 12 meses) y decirlo en Privacidad.                                                        |
| M6  | Sesión: se cierra a los 30 min solo con la pestaña abierta; con la pestaña cerrada dura para siempre. Hay que definirlo (decisión: una vez por dispositivo + botón Salir).                               |
| M7  | Direcciones viejas de Vercel en `index.html`, `sitemap.xml`, `robots.txt` y `llms.txt`: Google y la vista previa de WhatsApp apuntan al sitio viejo.                                                     |
| M8  | Sin anti-robots (Turnstile) en el ingreso ni protección de contraseñas filtradas; hoy frena solo el límite de intentos de Supabase.                                                                      |
| M9  | Velocidad en celular: lo más grande tarda 2,8 s (meta: 2,5); `logo.png` pesa 130 KB; las fotos de la base no tienen versiones chicas; hay un pequeño salto de la pantalla al cargar (0,099; límite 0,1). |
| M10 | Formulario de contacto con 9 campos: largo para un celular.                                                                                                                                              |

### Menores

- Una fuente chica viene incrustada y la regla de seguridad la bloquea (error en consola, no se nota).
- El contador de envíos del formulario guarda una "huella" de la IP que se podría revertir; se borra a las 24 h. Privacidad dice que no se guarda la IP: ajustar el texto o usar una huella con clave.
- Tope global de 200 consultas por día: alguien podría llenarlo a propósito (el formulario ofrece WhatsApp si falla).
- Una dirección inexistente responde "todo bien" (200) en vez de "no existe" (404): detalle para Google.
- Las tareas de GitHub usan versiones por etiqueta (`@v4`) en vez de fijas.
- `vercel.json` y `is_featured` quedan sin uso.

## Orden propuesto

1. A1, A2, A3, A5, M1, M3 (datos correctos siempre) → 2. A4 (Excel con lo publicado) →
2. M6 + ingreso nuevo → 4. A8 (backups) → 5. A6, A7, A9 con el servicio de mail →
3. M7, M9 y el resto junto con el panel nuevo.
