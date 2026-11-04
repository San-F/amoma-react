# 06 · Fraudes y abuso

La seguridad del código no alcanza: muchos ataques van contra **las personas** del negocio.
Esto se le explica al cliente en la entrega.

## Comercio chico (pastelería, tienda)

| Fraude                                                   | Cómo se ve                                                    | Cómo se previene                                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comprobante de transferencia falso** (muy común en AR) | Mandan captura/PDF editado "ya te transferí"                  | Confirmar **en la app del banco** antes de entregar. Nunca por la captura.                                                                                                    |
| **Pedidos falsos / no-shows**                            | Encargan una torta grande y no aparecen                       | Seña por adelantado para pedidos grandes o personalizados.                                                                                                                    |
| **Suplantación del negocio**                             | Cuenta falsa de Instagram/WhatsApp que cobra señas            | Link oficial a WhatsApp/IG **desde la web**; perfil de WhatsApp Business verificado; avisar a clientes que el único número es X.                                              |
| **Phishing a la dueña**                                  | Mail "de Supabase/Vercel/Instagram" pidiendo entrar a un link | Entrar siempre escribiendo la dirección; MFA en todas las cuentas; nadie legítimo pide códigos.                                                                               |
| **Robo de cuenta por SIM swap**                          | Le roban la línea y reciben los SMS                           | Doble factor con **app (TOTP)**, no SMS. PIN en la línea con la compañía.                                                                                                     |
| **Spam en formularios**                                  | Cientos de consultas basura                                   | Turnstile + límite de envíos + validación en servidor.                                                                                                                        |
| **Precio manipulado** (si se cobra online)               | Alguien cambia el precio en el navegador                      | El precio se **recalcula en el servidor**; el pago se confirma por **webhook firmado**, no por la redirección. Nunca guardar tarjetas: checkout del proveedor (Mercado Pago). |
| **Dominio vencido**                                      | El dominio no se renueva y alguien lo compra                  | Renovación automática, mail de contacto vigente, recordatorio anual.                                                                                                          |
| **Reseñas falsas**                                       | Inventar testimonios                                          | No hacerlo (engaña y es ilegal). Solo testimonios reales con permiso.                                                                                                         |

## Gimnasio / sistemas con socios

| Riesgo                                         | Prevención                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **QR compartido** (un socio pasa el QR a otro) | QR rotativo de vida corta (tipo TOTP) validado en el servidor; registro de cada ingreso; alerta si el mismo socio entra dos veces seguidas. |
| **Cuota vencida que sigue entrando**           | El molinete/recepción consulta el estado **en el servidor** en cada ingreso.                                                                |
| **Apto médico falso o vencido**                | Fecha de vencimiento en la base; bloqueo automático; archivo en bucket privado.                                                             |
| **Ex-empleado con acceso**                     | Baja el mismo día; cuentas individuales (nunca usuario compartido); auditoría.                                                              |
| **Datos de salud filtrados**                   | Dato sensible (Ley 25.326): acceso mínimo, registro de quién lo ve, nunca en mails ni exportaciones abiertas.                               |
| **Reservas acaparadas por bots**               | Límite por socio + cupo controlado **en la base** (transacción).                                                                            |

## Señales de alarma a enseñar al cliente

- Urgencia ("pagá ya o se cancela"), cambios de número ("ahora escribime a este otro"),
  links acortados, pedidos de códigos de verificación. Ante la duda: **cortar y verificar por otro canal**.
