# 07 · Errores frecuentes (de la IA y de las personas)

Revisar esta lista en **cada diff** antes de dar algo por terminado.

## Seguridad

1. Clave secreta en el front o en una variable `VITE_*` (todo `VITE_*` es público).
2. Tabla nueva sin RLS, o política `USING (true)` para escribir.
3. "Logueado = admin". El rol tiene que estar en una tabla y chequearse en la base.
4. Validar solo en el navegador. La base (y el servidor) tienen que validar también.
5. Subidas de archivos sin límite de tipo/tamaño en el servidor; usar el nombre original del archivo.
6. `dangerouslySetInnerHTML` con contenido de usuarios.
7. Mostrar el error técnico al usuario (filtra información). Mensajes genéricos; el detalle a logs.
8. `console.log` con datos personales.
9. Scripts de terceros "porque sí" (kits de íconos, fuentes de Google, analytics): cada uno puede
   ejecutar código en tu sitio y rompe una CSP estricta.
10. `.gitignore` que ignora `.env` pero no `.env.local` (pasó en Amoma; ahora se ignora `.env.*`).

## Dependencias

11. Paquetes inventados por la IA o con nombre parecido al real (_slopsquatting_). Verificar con
    `npm view <paquete>`: que exista, repositorio oficial, mantenedores conocidos.
12. Paquetes populares con vulnerabilidades sin parche (ej. `xlsx` de npm) → buscar alternativa mantenida.
13. Versiones sin fijar. Usar `npm i -E` y `package-lock.json`; `npm audit` en CI.

## Código y proceso

14. Hacer todo de una → se mezcla todo. Etapas chicas.
15. Decir "listo" porque compila. Abrirlo en el navegador, en celular, y probar el flujo completo.
16. **Ocultar el resultado de un chequeo** al encadenarlo con `| head` o `| grep`: el pipeline
    devuelve el código del último comando y un fallo pasa desapercibido (pasó en Amoma con el formato).
    Guardar la salida en un archivo y mirar el código de salida.
17. Borrar un archivo CSS y no notar que otros componentes usaban sus clases (pasó: los campos de
    formulario quedaron sin estilo). Estilos compartidos → archivo global.
18. Componentes gigantes que mezclan datos, lógica y diseño.
19. Estados olvidados: cargando, error, vacío. Nunca pantalla en blanco.
20. Usar APIs viejas copiadas de ejemplos antiguos. Verificar con la documentación actual.
21. Inventar funcionalidades o datos (precios, reseñas, sabores). Lo que no se sabe, se marca "a confirmar".

## Diseño

22. Contraste insuficiente medido "a ojo" (el rosa de marca con blanco daba 2.96:1). Medir.
23. Elementos decorativos que se salen del ancho en celular (scroll lateral por 2 px).
24. Orden de dibujo en SVG/capas al revés (las capas de la torta se veían mal).
25. Fotos de banco/IA representando productos del negocio.

## Infraestructura y negocio

26. Hosting "gratis" que **no permite uso comercial** (Vercel Hobby) → Cloudflare Pages.
27. Plan gratis que pausa la base por inactividad → keepalive.
28. Sin backups → backup encriptado automático.
29. Banner de cookies cuando no hay cookies (ruido) — o al revés, rastreo sin aviso.
30. Pasarle contraseñas a la IA por el chat. Nunca: van en el gestor de contraseñas o en "secrets".
31. **QR del doble factor que no se ve**: Supabase devuelve el SVG sin codificar dentro de un
    `data:` URL; si el SVG trae `#` (colores), el navegador corta la URL y la imagen no carga.
    Re-codificarlo (`src/admin/lib/qr.js`) y probar con un simulador que devuelva el formato real.
32. Probar con datos simulados que "ayudan" (ya codificados, sin casos raros) esconde errores:
    el simulador tiene que imitar el formato **real** del servidor.
