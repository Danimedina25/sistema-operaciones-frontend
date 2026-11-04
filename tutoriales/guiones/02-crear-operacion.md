# Tutorial 02 · Crear una operación y registrar pagos de ingreso

- **Rol:** Socio Comercial (Laura Méndez, `socio@tutorial.test`)
- **Duración objetivo:** 2 min 30 s
- **Formato:** 16:9, 1920 × 1080
- **Datos:** ficticios, base `db_sistema_operaciones_tutorial`

Escenario: Laura registra una operación de **$150,000.00** para **Alejandro Torres**, con
**Jorge Navarro** como socio de nivel 2. El cliente pagó en dos partes: una transferencia de
**$100,000.00** a BANCO DEMO y un depósito de **$50,000.00** a BANCO EJEMPLO.

---

## Escena 1 · Portada (5 s)

- **En pantalla:** portada con el título "Crear una operación" y el subtítulo "Socio Comercial".
- **Narración:** "En este tutorial vas a aprender a crear una operación y registrar los pagos de ingreso de tu cliente."

## Escena 2 · Entrar a Operaciones (10 s)

- **Acción:** la sesión ya está iniciada en Mis pendientes. Clic en **Operaciones** del menú y luego en **Nueva operación**.
- **Texto en pantalla:** "Operaciones › Nueva operación"
- **Narración:** "Desde el menú, entra a Operaciones y presiona Nueva operación."

## Escena 3 · Cliente y monto (20 s)

- **Acción:** escribir "Alejandro" en el buscador, elegir **Alejandro Torres** y capturar **150,000.00** en Monto total.
- **Texto en pantalla:** "1. Elige al cliente y el monto total"
- **Narración:** "Primero busca a tu cliente por su nombre y selecciónalo. Después escribe el monto total de la operación. El sistema le da formato automáticamente."

## Escena 4 · Red de socios (20 s)

- **Acción:** en Niveles de socios comerciales, elegir **2 niveles** y seleccionar a **Jorge Navarro**.
- **Texto en pantalla:** "2. ¿Quién comparte la comisión?"
- **Narración:** "Si en esta operación participa otro socio, indica cuántos niveles hay y selecciónalo. Él también recibirá su comisión. Si trabajas solo, deja un nivel."

## Escena 5 · Primer pago: transferencia (35 s)

- **Acción:** Pago 1: monto **100,000.00**, tipo **Transferencia**, fecha de hoy, cuenta destino **BANCO DEMO**, y subir el comprobante `transferencia-100000.png`.
- **Texto en pantalla:** "3. Registra cada pago con su comprobante"
- **Narración:** "Ahora registra los pagos que hizo tu cliente. Captura el monto, el tipo de pago, la fecha del comprobante y la cuenta a la que llegó el dinero. Después adjunta el comprobante. Puede ser una foto o un PDF."
- **Detalle a mostrar:** aparece arriba el resumen con Monto total, Registrado en pagos y Falta por cubrir ($50,000.00).

## Escena 6 · Segundo pago: depósito (30 s)

- **Acción:** clic en **Agregar otro pago**. Pago 2: monto **50,000.00**, tipo **Depósito**, fecha de hoy, cuenta **BANCO EJEMPLO**, y subir `deposito-50000.png`.
- **Texto en pantalla:** "Una operación puede tener varios pagos"
- **Narración:** "Si el cliente pagó en partes, agrega otro pago. Cada uno puede llegar a una cuenta distinta. Fíjate en el resumen de arriba: cuando dice Monto total cubierto, ya registraste todo."

## Escena 7 · Registrar (15 s)

- **Acción:** clic en **Registrar operación**. Se abre el detalle de la operación.
- **Texto en pantalla:** "Listo: la operación queda en validación"
- **Narración:** "Presiona Registrar operación. El sistema te lleva al detalle, donde ves los pagos esperando validación."

## Escena 8 · Qué sigue (15 s)

- **Acción:** recorrer despacio la sección de pagos del detalle.
- **Texto en pantalla:** "Cajas valida efectivo y cheques · Cuentas valida transferencias y depósitos"
- **Narración:** "Ahora la Jefa de Cuentas validará estos pagos. Si un comprobante es rechazado, lo verás en Mis pendientes para corregirlo. Y si todavía te falta registrar algún pago, la operación queda como Ingreso parcial hasta que lo completes."

## Escena 9 · Cierre (5 s)

- **En pantalla:** cierre con "Siguiente tutorial: Solicitar un retorno".
- **Narración:** "En el siguiente tutorial verás cómo solicitar el retorno a tu cliente."

---

## Comprobantes necesarios

| Archivo | Tipo | Monto | Banco | Detalle |
| --- | --- | --- | --- | --- |
| `transferencia-100000.png` | Transferencia SPEI | $100,000.00 | BANCO DEMO, cuenta ••1234 | Ordenante: Alejandro Torres |
| `deposito-50000.png` | Ficha de depósito | $50,000.00 | BANCO EJEMPLO, cuenta ••5678 | Depositante: Alejandro Torres |

Ambos con sello "EJEMPLO", sin logos ni marcas de bancos reales.
