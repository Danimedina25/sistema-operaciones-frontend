# Movimientos bancarios — libro derivado

Integra Caja General, las cuentas bancarias y los cortes diarios en una sola definición
contable. Ruta de navegación: `/corte/movimientos`. Backend: `com.sistemadeoperaciones.corte`.

## El problema que resuelve

Caja General guardaba el banco como texto libre (`cash_general_movements.banco`, validado
contra una lista fija de seis cadenas) sin ninguna relación con `bank_accounts`. Un **cheque
cobrado** —dinero que sale de una cuenta y entra como efectivo físico— sólo se registraba del
lado de la caja: el saldo bancario nunca bajaba y la cuenta quedaba inflada de forma
permanente. Tampoco existía un historial auditable unificado de lo que mueve una cuenta.

## Decisión de arquitectura: libro derivado, no tabla de asientos

Se evaluaron dos caminos y se eligió el primero.

1. **Derivar** el libro de las fuentes que ya existen. *(elegido)*
2. Persistir un libro canónico `bank_account_movements` alimentado por doble escritura.

Las razones, verificadas contra el código:

- **Las tres fuentes ya son filas persistidas y auditables con llave foránea real a
  `bank_accounts`**: `operation_payments.cuenta_destino_id`,
  `operation_return_installments.cuenta_origen_id` y —lo único que faltaba— el nuevo
  `cash_general_movements.bank_account_id`. Una tabla canónica no agregaría ningún dato que
  no esté ya.
- **La doble escritura es justamente la superficie donde aparece la doble contabilización.**
  Habría que escribir desde `PaymentOperationServiceImpl.validatePayment` —que no toma ningún
  bloqueo— y desde `ReturnInstallmentServiceImpl.recomputeInstallmentStatus`, que se reejecuta
  al confirmar, entregar y cancelar. Cada reejecución necesitaría su propia idempotencia y un
  asiento compensatorio al salir de `COMPLETADA`, más un backfill histórico.
- **Derivando, la identidad entre el libro y el corte es estructural.** `BankLedgerQuery` es
  la única definición: `BankAccountDailyCutServiceImpl` consume sus mismos importes agrupados.
  Antes esa fórmula estaba duplicada literalmente en dos métodos del servicio de cortes.
- **El cheque cobrado no puede quedar a medias**: la entrada de efectivo y la salida bancaria
  *son la misma fila*. La atomicidad es gratis, no depende de una transacción bien escrita.

`BankAccount` **no** tiene columna de saldo: el saldo proviene siempre de movimientos
auditables más el corte anterior.

## Matriz contable implementada

| Evento | Cuenta bancaria | Caja General |
|---|---|---|
| Pago validado por transferencia | Entrada | Sin efecto |
| Pago validado por depósito | Entrada | Sin efecto |
| Pago validado por cheque (del cliente) | Entrada | Sin efecto |
| Retorno completado por transferencia | Salida | Sin efecto |
| Retorno completado por depósito | Salida | Sin efecto |
| Retorno completado por cheque | Salida | Sin efecto |
| Retorno completado por retiro sin tarjeta | Salida | Sin efecto |
| Retorno completado en efectivo | Sin efecto | Salida |
| Cheque cobrado en Caja General | **Salida** | **Entrada** |
| Retiro sin tarjeta en Caja General | **Salida** | **Entrada** |

Un pago sólo cuenta como `VALIDADA` y por su `fechaValidacion`; una parcialidad sólo como
`COMPLETADA` y por su `fechaRealizacion`.

## Retiros de banco hacia la caja

Dos conceptos de Caja General describen el mismo hecho contable —efectivo que sale de una
cuenta bancaria y entra a la caja— con distinto instrumento: **cheque cobrado** y **retiro sin
tarjeta**. Los dos siguen exactamente las mismas reglas:

1. Exigen una cuenta bancaria **real y activa**, identificada por `bankAccountId`. El nombre
   del banco ya no es identidad: se rechaza si viene como texto.
2. Sólo existen en dirección `ENTRADA`: retirar del banco únicamente puede meter efectivo a la
   caja, nunca sacarlo. Lo rechaza el servicio y además lo impide una restricción `CHECK`.
3. El importe entra a Caja General y sale de la cuenta en la misma fila y la misma transacción.
4. Son idempotentes por el `requestId` que ya usaba Caja General. Reutilizar el UUID con otra
   cuenta se rechaza con conflicto.
5. Conservan el nombre del banco como snapshot para que el histórico siga siendo legible.
6. El movimiento bancario conserva la referencia al movimiento de Caja General que lo originó.

`EFECTIVO` nunca admite banco ni cuenta.

**`RETIRO_CON_TARJETA` ya no existe.** Nunca existió en la operación: se retira sin tarjeta,
con un código generado contra una cuenta concreta. El valor se conserva en el enum sólo para
poder leer movimientos históricos que lo usaron, y esos conservan su texto de banco sin cuenta
vinculada. Con esto desaparece el último uso del catálogo fijo de nombres de banco: todo
movimiento que toca un banco lo hace por llave foránea.

## Alcance de cada corte (definido por negocio)

- **"Cortes y saldos"** (`daily_cash_cuts`, global) es la posición de las **cuentas bancarias**.
- **"Caja General"** (`cash_general_days`) es el **efectivo físico**.

De ahí se sigue que cobrar un cheque en ventanilla es una **salida del corte global**: el
dinero dejó el banco y se volvió efectivo. Su entrada correspondiente ya vivía en el libro de
Caja General. Antes de este cambio el corte global nunca miró `cash_general_movements`, así que
el saldo bancario quedaba inflado por cada cheque cobrado.

La columna es `daily_cash_cuts.salidas_cheque_cobrado`, con `DEFAULT 0` y sin recálculo: los
cortes históricos conservan intactos su `total_salidas` y su `saldo_final`, y la cadena de
saldo inicial no se mueve.

A diferencia del corte **por cuenta**, el corte **global** incluye también los cheques
históricos que sólo guardan el nombre del banco como texto: no se sabe de qué cuenta salieron,
pero salieron de alguna, y aquí no hace falta atribuirlos.

La fórmula del corte global quedó así:

```
total entradas = pagos validados por transferencia + depósito + cheque
total salidas  = retornos completados por transferencia + depósito + cheque + retiro sin tarjeta
               + comisiones pagadas a socios
               + cheques cobrados
saldo final    = saldo inicial + total entradas − total salidas
```

Tres consecuencias de la definición:

- **El efectivo sale del total.** `entradasEfectivo` y `retornosEfectivo` se siguen calculando
  y guardando como dato informativo del día, pero ya no mueven el saldo: ese dinero entra y
  sale de Caja General, que tiene su propio libro.
- **El retiro sin tarjeta entra al total.** Sale de la cuenta origen de la parcialidad y
  faltaba por completo: el corte sumaba transferencia, depósito, efectivo y cheque, pero nunca
  este tipo. Cada retiro entregado dejaba el saldo bancario inflado. En el corte **por cuenta**
  sí se restaba desde antes, así que las dos vistas se contradecían.
- **El cheque cobrado se resta**, por lo explicado arriba.

### Recalcular la serie histórica

A diferencia de las columnas anteriores, este cambio sí altera el significado de los cortes ya
guardados, porque su fórmula era otra. Para dejar la cadena coherente hay que rehacerla:

```
POST /api/daily-cash-cuts/recalculate?desde=YYYY-MM-DD    (rol ADMIN)
```

Es determinista e idempotente: los importes se recalculan siempre desde los pagos, retornos y
cheques originales, nunca desde los agregados guardados. Lo único que respeta es el
`saldo_inicial` capturado a mano en el primer corte de la historia, que es un dato de negocio y
no se puede derivar de ningún movimiento. **Si ese número incluía efectivo, hay que corregirlo
aparte**: ninguna operación automática puede saberlo.

Los dos retiros de banco hacia la caja —cheque cobrado y retiro sin tarjeta— se agrupan en la
columna `salidas_caja_general` de ambos cortes. El detalle por instrumento se consulta en
Movimientos bancarios.

## Cortes bancarios

`bank_account_daily_cuts` gana la columna `salidas_cheque`, con `DEFAULT 0`. Se agrega como
columna y **no** como recálculo: los cortes históricos nunca se recalculan (para `fecha < hoy`
manda la fila almacenada), y con valor cero toda fila previa conserva exactamente su
`total_salidas` y su `saldo_final`. Antes de este cambio ningún cheque tenía cuenta vinculada,
así que cero es el valor correcto para todo el histórico.

Se mantiene `saldo final = saldo inicial + entradas − salidas`, y el saldo inicial sigue
proviniendo del último corte anterior de esa cuenta.

Dos correcciones de camino:

- **La ventana del día es ahora semiabierta** (`>= inicio` y `< inicio del día siguiente`).
  La anterior cerraba en `23:59:59` y perdía para siempre los movimientos de ese último
  segundo, porque el día siguiente arrancaba en `00:00:00`.
- **`registerDailyCut` recorre todas las cuentas**, no sólo las activas. Una cuenta desactivada
  con saldo dejaba de generar corte y su cadena de saldo inicial se rompía.

Se compara contra instantes y no contra una fecha truncada a propósito: Hibernate convierte el
parámetro con la misma zona con la que escribió el valor, así que la comparación es correcta
con o sin `hibernate.jdbc.time_zone`.

## Eliminación administrativa

Al eliminar un corte de Caja General que contenía cheques cobrados, sus salidas bancarias
desaparecen. `CashGeneralService.deleteDay` recoge las cuentas afectadas y, en la misma
transacción, llama a `BankAccountDailyCutService.recalculateFrom(cuenta, fecha)`: borra los
cortes de esa cuenta desde esa fecha en adelante y los regenera en orden ascendente, de modo
que la cadena vuelve a cuadrar. No se inventan cortes de fechas que nunca tuvieron uno. La
auditoría registra cuántos se regeneraron (`cortes_bancarios_recalculados`).

Una cuenta con cheques cobrados vinculados **no se puede eliminar**: se suma a las
dependencias que ya bloqueaban el borrado (`chequesCobradosCajaGeneral`).

## API

Respuestas en `ApiResponse<T>`. Es un módulo **de sólo consulta**: el controlador no expone
ningún `POST`, `PUT`, `PATCH` ni `DELETE`, y una prueba lo verifica por reflexión.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/bank-movements` | Página cronológica de movimientos |
| GET | `/api/bank-movements/summary` | Totales de entradas, salidas y neto |

Parámetros comunes: `desde`, `hasta` (obligatorios), `bankAccountId`, `banco`, `direccion`,
`tipo`. La búsqueda acepta además `page` y `size` (máximo 100).

Validaciones: rango obligatorio y ordenado, no futuro, máximo un año — el mismo criterio que
el libro de Caja General.

Roles: `ADMIN`, `GERENTE`, `DIRECCION`, `AUXILIAR_CUENTAS`, iguales a los de consulta de
saldos bancarios.

El renglón expone `origen`, `sourceId`, fecha y hora, dirección, tipo, concepto, importe,
la cuenta (`cuentaBanco`, `cuentaTitular`, `cuentaNumero`, `cuentaActiva`), las referencias a
operación, parcialidad o movimiento de caja, y el usuario. **`cuentaNumero` llega enmascarado
y no se expone la CLABE**: esta superficie nueva no amplía la información bancaria que ya
publican los demás endpoints.

Los totales se calculan en el servidor sobre todo el filtro. El frontend nunca suma la página
que tiene a la vista, y el contador usa `totalElements`.

## Frontend

- `src/shared/components/ui/BankAccountCombobox.tsx` — selector buscable, el primer combobox
  accesible del proyecto: patrón combobox de WAI-ARIA, navegación con flechas, `Home`/`End`,
  `Enter` (que nunca envía el formulario), `Escape`, cierre por clic fuera, y estados de carga,
  error y lista vacía. Busca por titular, banco y número, sin acentos ni separadores. Muestra
  sólo cuentas activas para capturas nuevas; las consultas históricas pasan `onlyActive={false}`.
- `src/shared/utils/bank-account-label.ts` — `Titular — Banco — Número`, en un solo lugar.
- `src/modules/corte/pages/BankMovementsPage.tsx` — la vista, sin ninguna acción de captura.

Sin dependencias nuevas.

## Pendiente y riesgos conocidos

1. **Semántica del pago `CHEQUE`.** Un pago de tipo cheque ya cuenta como *entrada* bancaria al
   validarse. Si esa validación ocurre cuando el cheque sólo se recibió en mano y todavía no se
   depositó, sumar además la salida por cheque cobrado deja saldos negativos aparentes. No son
   la misma entidad y no hay doble conteo de filas; el riesgo es de captura. **Requiere
   confirmación de negocio antes de desplegar.** No se cambió la lógica existente, y una prueba
   fija el comportamiento actual.
2. **Movimientos históricos de Caja General.** Los cheques capturados antes de este cambio sólo
   tienen el texto del banco. No se infiere ninguna cuenta a partir del nombre: quedan como
   "cuenta no vinculada" y no entran al libro. Corregirlos exige un mapeo manual.
3. **`RETIRO_CON_TARJETA`** tiene la misma forma contable que el cheque, pero las tarjetas no
   están modeladas y no hay forma de saber de qué cuenta retiran. Queda como trabajo aparte.
4. **`salidasComisiones` sigue en cero.** Las comisiones pagadas a socios comerciales nunca
   reducen el saldo bancario, aunque la columna existe desde el diseño original.
5. **`GET /grouped` escribe.** Persiste cortes faltantes como efecto lateral de una lectura. Se
   conservó el comportamiento para no cambiar qué fechas quedan materializadas.
6. **Zona horaria.** `hibernate.jdbc.time_zone=UTC` está en las pruebas pero no en producción.
   Las comparaciones del libro son correctas en ambos casos, pero la ambigüedad sigue ahí.
7. **Los seis selectores duplicados** de operaciones y retornos siguen con su implementación en
   línea. El componente compartido existe y se usa en lo nuevo; migrarlos toca formularios
   críticos de pagos y merece un cambio propio.
