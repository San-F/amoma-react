# Guía del panel de Amoma

Esta guía es para la dueña de Amoma. Explica cómo cargar y cambiar todo lo que se ve en la página,
**sin tocar código**. Se puede usar desde el celular o la compu.

> La dirección del panel es la de la página + `/admin`
> (por ejemplo `amoma-react.vercel.app/admin`).

---

## 1. Primera vez: crear tu contraseña y activar el doble factor

1. Te llega un **mail de invitación**. Tocá el link.
2. Elegí una contraseña **larga** (mínimo 15 letras). Lo más fácil es una frase:
   _"torta de limón los domingos"_.
3. Instalá en tu celular **Google Authenticator** o **Microsoft Authenticator** (gratis).
4. En la app tocá **"+"** y escaneá el código que muestra el panel.
5. Escribí los **6 números** que aparecen en la app. ¡Listo!

<img src="guia/02-doble-factor.jpg" width="300" alt="Pantalla para activar el doble factor">

**¿Por qué el doble factor?** Aunque alguien consiga tu contraseña, sin tu celular no puede cambiar
nada de la página. Es la misma protección que usan los bancos.

## 2. Entrar

Email + contraseña, y después los 6 números de la app (cambian cada 30 segundos).
Si te olvidaste la contraseña, tocá **"Olvidé mi contraseña"** y te llega un mail.

<img src="guia/01-ingresar.jpg" width="300" alt="Pantalla para ingresar">

Por seguridad, si dejás el panel abierto **30 minutos sin usar**, se cierra solo.

## 3. Resumen

Lo primero que ves: cuántos productos están publicados, cuántos ocultos y **cuántas consultas
nuevas** llegaron por el formulario de la página.

<img src="guia/03-resumen.jpg" width="300" alt="Resumen del panel">

## 4. Productos

- **Visible / Oculto**: con el tilde decidís si se ve en la página (sin borrarlo).
- Tocá el nombre para **editarlo**. **"+ Nuevo"** para crear uno.

<img src="guia/04-productos.jpg" width="300" alt="Lista de productos">

### Editar un producto

- **Nombre**, **categoría** y **descripción corta** (la que se ve en la tarjeta).
- **Tamaños y precios**: una fila por tamaño (ej. _Mediana · 15 porciones · 35000_).
  El precio va en pesos, sin puntos ni signo $ (igual los entiende).
- **Fotos**: tocá **"+ Agregar fotos"**. Se achican solas para que la página cargue rápido.
  La que tiene la **★** es la portada; tocá la estrella de otra para cambiarla.
- **Acomodar la foto**: apenas subís una foto se abre **"Acomodá la foto"**. Arrastrala con el dedo
  para que la torta quede al centro del círculo y usá la barra **"Acercar"** si querés que se vea más
  grande. El circulito de al lado muestra cómo va a quedar **en la tarjeta**. Tocá **Guardar**.
  Para cambiarla después, tocá la foto (dice **"Acomodar"**). **"Centrar"** la deja como estaba.
- Para que se vea en la página tiene que tener **al menos un precio y una foto**.

<img src="guia/05-editar-producto.jpg" width="300" alt="Editar producto">

## 5. Cambiar muchos precios juntos con Excel

1. Tocá **"Descargar mi catálogo"**: baja una planilla con **todo lo que tenés cargado**, una fila por
   tamaño.
2. Abrila con Excel y cambiá lo que necesites:
   - **Precios**: escribí el número nuevo.
   - **Producto nuevo**: agregá una fila al final (si tiene 2 tamaños, 2 filas con el mismo nombre).
     La columna "codigo" dejala vacía.
   - La columna **"codigo" no se toca** en las filas que ya vinieron: es lo que une cada fila con su
     producto (así podés cambiarle el nombre sin que se duplique).
   - Lo que borres de la planilla **no** se borra de la página.
3. Guardala y subila en **"Elegir planilla"**.
4. Revisá la **vista previa**. Si hay algo mal, te dice en qué fila (ej. _"Fila 4: el precio no es
   válido"_). Corregilo en el Excel y volvé a subirlo.
5. Tocá **"Importar"**. Si algo falla, **no se guarda nada** (no queda a medias).

**Las fotos no van en la planilla.** A los productos nuevos se las ponés después: en **Productos**,
tocá el círculo **"+ Foto"** de cada uno. Hasta que no tenga foto, un producto no aparece en la página.

<img src="guia/06-excel.jpg" width="300" alt="Cargar desde Excel">

## 6. Galería

Las fotos de trabajos que se ven en la página "Galería". Las **3 primeras** aparecen también en
"Tortas personalizadas". Con las flechas **↑ ↓** cambiás el orden. Escribí una descripción corta de
cada foto: la usan Google y las personas que no ven bien.

<img src="guia/07-galeria.jpg" width="300" alt="Galería">

## 7. Consultas

Lo que la gente manda desde el formulario de **Contacto**. Tocá el WhatsApp o el email para
responder, y después **"Marcar respondida"** para no perderle el rastro.

<img src="guia/08-consultas.jpg" width="300" alt="Consultas">

## 8. Ajustes

- **WhatsApp**: el número al que llegan todos los pedidos (con 549 adelante, ej. 5491136362466).
- **Instagram**, **zona**, **horarios**.
- **Aviso destacado**: una franja rosa arriba de toda la página. Ideal para
  _"Agenda de diciembre completa"_ o _"Cerrado por vacaciones hasta el 10/1"_. Dejalo vacío para sacarlo.

<img src="guia/09-ajustes.jpg" width="300" alt="Ajustes">

---

## Cuidados importantes 🔒

- **Nunca** le pases tu contraseña ni los 6 números a nadie. Nadie de soporte te los va a pedir.
- Si te llega un mail "urgente" pidiendo que entres a un link para "verificar tu cuenta", **no lo
  toques**: entrá escribiendo vos la dirección del panel.
- **Comprobantes de transferencia**: confirmá siempre en la app del banco que la plata entró antes de
  entregar. Las capturas y PDFs se falsifican fácil.
- Para tortas grandes o personalizadas, pedí **seña**.
- Si cambiás de celular, avisá antes para pasar el doble factor al nuevo.

## Si perdés o cambiás el celular

El código de 6 números vive en la app de tu celular. Si lo perdés o cambiás de teléfono, **no podés
entrar** hasta que Francisco te lo reinicie (en Supabase → Authentication → Users → tu usuario →
borrar el factor de doble factor). Después entrás con tu contraseña y escaneás un código QR nuevo.
Si cambiás de celular y todavía tenés el viejo, avisá **antes** de deshacerte de él.
