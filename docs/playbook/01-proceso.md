# 01 · Proceso paso a paso

La IA (y cualquier persona) se equivoca cuando intenta hacer todo de una. Se trabaja **por etapas**,
cada una con un objetivo, un "listo cuando…" verificable y una revisión antes de seguir.

## Las etapas

| Etapa                                | Qué se hace                                                                                                                               | Listo cuando…                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **0. Descubrimiento**                | Quién es el usuario, qué tiene que poder hacer, qué datos se guardan, qué cuesta (cero, idealmente), referencias que le gustan al cliente | Hay un `docs/PLAN.md` aprobado y una lista de pendientes del cliente |
| **1. Fundaciones**                   | Repo ordenado, lint + formato + build en CI, cabeceras de seguridad, sin scripts de terceros, Dependabot                                  | CI verde, el sitio se ve igual que antes                             |
| **2. Base de datos**                 | Esquema, RLS, permisos mínimos, migraciones versionadas, tests que intentan romper los permisos                                           | Tests de permisos pasan; ninguna tabla sin RLS                       |
| **3. Login y panel**                 | Auth, doble factor, roles, pantallas de carga (CRUD, fotos, Excel)                                                                        | El cliente carga todo sin tocar código; un no-admin no puede nada    |
| **4. Sitio público**                 | Lee de la base con respaldo fijo; formularios reales con anti-spam                                                                        | Lo cargado en el panel aparece en el sitio                           |
| **5. Diseño premium**                | Dirección de arte, secciones con propósito, motion medido                                                                                 | El cliente lo aprueba en su celular                                  |
| **6. Velocidad, SEO, accesibilidad** | Fotos optimizadas, metadatos, vista previa al compartir, axe sin errores                                                                  | Lighthouse ≥ 90, axe OK                                              |
| **7. Auditoría y entrega**           | Revisión de seguridad completa, backups, dominio, guía para el cliente                                                                    | Checklist de [09](09-operacion-y-entrega.md) completo                |

El orden 4 ↔ 5 puede invertirse: en Amoma mostramos el diseño antes porque el cliente quería
ver algo. Lo importante es **no mezclar dos etapas en el mismo pedido**.

## Dentro de cada etapa

1. **Planificar**: qué archivos, qué se prueba, qué puede salir mal.
2. **Implementar en pasos chicos**, un commit por paso con mensaje claro.
3. **Verificar de verdad**: lint, formato, tests, build **y** abrir la página en un navegador
   (capturas en celular y compu). "Compila" no es "funciona".
4. **Probar el caso malo**: meter a propósito el error típico y confirmar que los tests lo frenan.
5. **Cerrar** con un resumen y esperar el OK.

## Git

- Trabajar en una rama; `main` es lo publicado. Pasar a `main` solo con OK del dueño.
- Mensajes de commit que expliquen **por qué**, no solo qué.
- Nunca subir `.env*` (salvo `.env.example` vacío). Revisar `.gitignore` el día 1.
- El CI tiene que fallar si falla cualquier chequeo. Nunca "saltar" un test para que pase.

## Escuchar al cliente (lo que aprendimos)

- Mostrar algo navegable temprano: las capturas no alcanzan, el cliente quiere tocarlo en su celular.
- Cuando el cliente dice "no me gustó", preguntar **qué parte** y qué referencia le gusta.
  En Amoma: el armador interactivo no gustó; las fotos de calidad y la portada sí. Se rehízo en un día.
- Tener un `docs/PENDIENTES.md` con lo que falta **del cliente** (datos, fotos, cuentas) separado de lo
  que falta **del código**.
