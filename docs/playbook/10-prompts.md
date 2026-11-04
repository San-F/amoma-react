# 10 · Cómo pedirle cosas a Claude

Mensajes que funcionan. Cuanto más concreto el pedido (y más chica la etapa), mejor el resultado.

## Arrancar un proyecto nuevo

> Leé `CLAUDE.md` y `docs/playbook/`. Vamos a hacer la web de **[negocio]** ([rubro], [zona]).
> El usuario principal es **[quién]** y tiene que poder **[acciones]**. El dueño necesita **[panel: qué carga]**.
> Referencias que me gustan: [links]. Presupuesto: **cero** (solo planes gratis sin tarjeta).
> Primero armá `docs/PLAN.md` por etapas y `docs/PENDIENTES.md`. No programes todavía.

## Pedir una etapa

> Hacé la **Etapa N** del plan. Al terminar: corré todos los chequeos, probalo en el navegador
> (celular y compu), mostrame capturas, y frená para que lo revise.

## Pedir una revisión de seguridad

> Revisá el código contra `docs/playbook/03-seguridad.md` y `07-errores-frecuentes.md`.
> Intentá romper los permisos como anónimo, usuario común y admin sin doble factor.
> Listame hallazgos por gravedad antes de cambiar nada.

## Feedback de diseño

> No me gustó **[sección]** porque **[motivo]**. Me gusta cómo lo hace **[referencia]**.
> Lo que sí quiero mantener: **[x]**. Repensalo desde el usuario que entra desde el celular.

## Reglas para mí (el humano)

- Nunca pegar contraseñas ni claves secretas en el chat. Solo las públicas (URL, publishable key).
- Pedir que trabaje en una rama y pasar a `main` cuando lo apruebo.
- Si algo "anda raro", pedir que lo reproduzca y muestre la prueba, no que adivine.
