# Contrato de backend: parcialidades de retorno

Una **solicitud de retorno** (`OperationReturnPayment`) representa lo que pidió el
socio. Ahora se cubre con una o varias **parcialidades**
(`OperationReturnInstallment`), cada una un movimiento propio (monto, comprobante,
cuenta origen, código, evidencia, responsable, fechas) ligado explícitamente al
`id` de una solicitud. El backend es la fuente de verdad de montos, % de avance y
estatus; el frontend solo los presenta.

## 1. Totales por solicitud

`ReturnPaymentResponse` incluye (calculados en el servidor a partir de las
parcialidades):

```
montoSolicitado   = solicitud.monto
montoRetornado    = Σ parcialidad.monto  (estatus COMPLETADA)
montoEnProceso    = Σ parcialidad.monto  (estatus PROGRAMADA | ENTREGADA)
montoPendiente    = montoSolicitado - montoRetornado
montoDisponible   = montoSolicitado - montoRetornado - montoEnProceso   // tope de una nueva parcialidad
porcentajeAvance  = montoRetornado / montoSolicitado * 100
numeroParcialidades = # de parcialidades no canceladas
parcialidades[]   = historial (solo en respuestas de detalle: GET .../{operationId}/payments)
```

Aritmética con `BigDecimal`/`DECIMAL(15,2)`, `HALF_UP`. Programadas/entregadas
**no** cuentan como retornado (ver ejemplo OP-1500).

## 2. Estatus

### Solicitud (`ReturnPaymentStatus`) — recalculado tras cada cambio de parcialidad
- `SOLICITADO` — sin parcialidades activas ni completadas.
- `EN_RECOLECCION` — hay una parcialidad PROGRAMADA, ninguna completada.
- `ENTREGADO` — hay una parcialidad ENTREGADA, ninguna completada.
- `PARCIALMENTE_RETORNADO` *(nuevo)* — ≥1 completada y aún hay saldo pendiente.
- `RETORNADO` — la suma de completadas cubre el monto solicitado.

### Parcialidad (`ReturnInstallmentStatus`, `VARCHAR`)

Efectivo/RST: el cierre tiene **dos marcas independientes**, en cualquier orden:
la confirmación del **socio comercial** (`fechaConfirmacion` + `confirmadoPor`) y
el cierre de la **jefa de cajas** (`fechaEntrega` + `entregadoPor` + foto +
persona que recibió). `estatus` se recalcula tras cada marca
(`recomputeInstallmentStatus`) y es una proyección de esas dos:

- `PROGRAMADA` — recolección agendada, ninguna de las dos marcas. No cuenta.
- `ENTREGADA` — **"confirmación parcial"**: exactamente una de las dos marcas
  (falta la otra parte). No cuenta.
- `COMPLETADA` — **ambas** marcas. **Única que cuenta como retornado**;
  `fechaRealizacion` se fija en este momento (no antes).
- `CANCELADA` — cancelada **solo desde `PROGRAMADA`** (ninguna marca aún).
  Libera el saldo.

Transferencia/depósito/cheque: la parcialidad nace `COMPLETADA` (movimiento ya hecho).

### Operación (`OperationStatus`)
`montoRetornadoOperacion = Σ COMPLETADA de todas las solicitudes`.
- `== 0` → conserva `RETORNO_PARCIAL_SOLICITADO` / `RETORNO_TOTAL_SOLICITADO`.
- `0 < x < amountToReturn` → `RETORNO_PARCIAL_ENTREGADO`.
- `x >= amountToReturn` → `RETORNADA`.

## 3. Endpoints (base `/api/operations/returns`)

| Verbo + ruta | Roles | Cuerpo | Efecto |
|---|---|---|---|
| `POST /requests/{returnRequestId}/installments` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS, JEFA_CUENTAS, AUXILIAR_CUENTAS (el servicio valida que el rol corresponda al método) | `{ monto, cuentaOrigenId?, comprobanteUrl?, fechaHoraRecoleccion?, codigoRetiroSinTarjeta?, observaciones? }` | transf → parcialidad `COMPLETADA` (exige cuentaOrigen + comprobante); efectivo/RST → `PROGRAMADA` (exige fechaHoraRecoleccion; RST además cuentaOrigen + código) |
| `GET /requests/{returnRequestId}` | 7 roles (incl. socio) | — | `{ solicitud: ReturnPaymentResponse, parcialidades: ReturnInstallment[] }` |
| `GET /requests/{returnRequestId}/installments` | 7 roles | — | `ReturnInstallment[]` |
| `PATCH /installments/{installmentId}/confirm` | SOCIO_COMERCIAL (dueño) | — | Marca "socio confirmó" (independiente de la jefa). `PROGRAMADA\|ENTREGADA → ENTREGADA\|COMPLETADA` según falte o no la otra marca |
| `PATCH /installments/{installmentId}/deliver` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | `{ comprobanteEntregaUrl, personaQueRecibioEfectivo }` | Marca "jefa cerró" (independiente del socio) + evidencia + persona autorizada. `PROGRAMADA\|ENTREGADA → ENTREGADA\|COMPLETADA` según falte o no la otra marca |
| `PATCH /installments/{installmentId}/cancel` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS, JEFA_CUENTAS, AUXILIAR_CUENTAS | `{ motivo }` | `PROGRAMADA → CANCELADA` (solo sin ninguna marca) |
| `GET /installments/today-deliveries?fecha&tipoPago` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | — | `Page<ReturnInstallment>` (PROGRAMADA/ENTREGADA por `fechaHoraRecoleccion`) |
| `GET /installments/late` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | — | `Page<ReturnInstallment>` (PROGRAMADA con recolección vencida) |

`ReturnInstallment` incluye datos de la solicitud/operación para listados:
`returnRequestMonto`, `returnRequestEstatus`, `clienteNombre`,
`socioComercialNombre`, `socioComercialTelefono`, `autorizadoParaRecibir1..3`.

`personaQueRecibioEfectivo` (string | null): persona que recibió físicamente el
efectivo / realizó el retiro sin tarjeta. Si coincide con un autorizado se guarda
el nombre canónico de la solicitud; si es alguien ajeno a la lista se guarda el
nombre normalizado tal cual se capturó (ver `recibioPersonaAutorizada`). `null`
en parcialidades históricas → el frontend muestra "No registrado (entrega
histórica)". Es **distinta** de `entregadoPorNombre` (usuario interno del sistema
que cerró la entrega). Etiquetas de UI: "Persona que recibió" (efectivo) /
"Persona que realizó el retiro" (retiro sin tarjeta).

`confirmadoPorSocio` / `cerradoPorJefa` (boolean): las dos marcas independientes
del cierre — ver sección 2. `confirmadoPorId` / `confirmadoPorNombre`: socio que
confirmó (contraparte de `entregadoPorId` / `entregadoPorNombre`, el usuario del
sistema que cerró).

`recibioPersonaAutorizada` (boolean | null): `true` si `personaQueRecibioEfectivo`
coincide con un autorizado de la solicitud; `false` si recibió alguien **ajeno a
la lista** (se acepta a propósito y se deja marcado para auditoría); `null` en
históricas. El frontend permite capturar el nombre de una persona no autorizada
("Otra persona") y lo muestra con una etiqueta "No autorizada" en el historial.

### Endpoints legacy (a nivel solicitud) — `@Deprecated`, siguen respondiendo
`PATCH /payments/{id}/realize`, `/cash-pickup-time`, `/confirm-cash-pickup`,
`/mark-cash-delivered` delegan creando/transicionando una parcialidad por el
saldo pendiente completo. El frontend nuevo ya no los usa.
`/mark-cash-delivered` ahora también exige `personaQueRecibioEfectivo` en el
cuerpo (delega en la misma ruta transaccional que `/installments/{id}/deliver`).

## 4. Reglas de negocio (backend, transaccionales con lock pesimista operación→solicitud)

1. La parcialidad pertenece a una solicitud existente.
2. Monto > 0.
3. `Σ(COMPLETADA) + Σ(PROGRAMADA+ENTREGADA) + nueva ≤ montoSolicitado`.
4. Método de la parcialidad = método de la solicitud (se copia, no se recibe).
5. Solicitud `RETORNADO` no admite nuevas parcialidades.
6. Concurrencia: dos peticiones que individualmente caben pero juntas superan el
   saldo → solo una se confirma; la otra falla con 400
   `ReturnInstallmentAmountExceedsAvailableException`.
7. Cancelar solo aplica a parcialidades `PROGRAMADA` (ninguna marca); recalcula
   solicitud y operación. Cancelar la última activa devuelve la solicitud a
   `SOLICITADO`.
8. **Doble confirmación independiente (efectivo / retiro sin tarjeta)** —
   `/confirm` (socio) y `/deliver` (jefa) ya no son secuenciales: cada uno se
   puede llamar mientras la parcialidad no esté `COMPLETADA` ni `CANCELADA`, sin
   importar si la otra parte ya actuó. `recomputeInstallmentStatus` recalcula el
   estatus tras cada marca; llega a `COMPLETADA` (y fija `fechaRealizacion`) solo
   cuando están **ambas**. Idempotencia por marca: `/confirm` rechaza si
   `fechaConfirmacion` ya está puesta; `/deliver` rechaza si `fechaEntrega` ya
   está puesta (ambos con `ReturnInstallmentInvalidStatusException`, 400, sin
   mutar). Cuando una parte cierra su marca antes que la otra, se notifica a la
   contraparte para que complete la suya.
9. **Cierre de la jefa (`/deliver`)** — se valida todo antes de mutar nada:
   - `comprobanteEntregaUrl` presente y no vacío
     (`ReturnInstallmentReceiptRequiredException`, 400).
   - `personaQueRecibioEfectivo` presente y no vacía
     (`ReturnInstallmentReceiverRequiredException`, 400).
   - Si el nombre coincide con un autorizado de la solicitud (comparando sin
     distinguir mayúsculas, espacios repetidos ni acentos) se persiste el
     **nombre canónico** de la solicitud y `recibioPersonaAutorizada = true`.
   - Si **no** coincide con ninguno (o la solicitud no tiene autorizados) se
     acepta igual: se persiste el nombre normalizado (trim + colapsa espacios) y
     `recibioPersonaAutorizada = false`. **Ya no se lanza excepción por persona
     no autorizada** — es una excepción registrada a propósito.
   - Método distinto de efectivo/RST, o estatus `COMPLETADA`/`CANCELADA` →
     `ReturnInstallmentInvalidStatusException`, 400 (sin cambiar estado).
   - Cualquier validación fallida deja intactos estatus y totales.

## 5. Notificaciones (`NotificationType`, módulo `PAGOS`, `referenceType` `RETURN_INSTALLMENT` o `PAYMENT_OPERATION`)

- `RETURN_INSTALLMENT_SCHEDULED` / `RETURN_INSTALLMENT_CODE_AVAILABLE` — recolección
  programada (efectivo/RST) → socio.
- `RETURN_INSTALLMENT_DELIVERED` — se reutiliza para ambos sentidos de la doble
  confirmación: si el socio confirma primero → JEFA_CAJAS/ADMIN ("ciérrala
  cuando puedas"); si la jefa cierra primero → el socio ("confírmala").
- `RETURN_INSTALLMENT_COMPLETED` — parcialidad realizada → socio, con monto de la
  parcialidad, solicitado, acumulado retornado, pendiente.
- `RETURN_REQUEST_COMPLETED` — solicitud completada → socio.
- `RETURN_INSTALLMENT_CANCELLED` — parcialidad cancelada → socio, con motivo.

Idempotencia: cada transición está guardada por su chequeo de estatus (lanza si
ya pasó) ⇒ cada notificación se dispara exactamente una vez.

## 6. Corte de caja / saldos bancarios

`DailyCashCutServiceImpl` y `BankAccountDailyCutServiceImpl` suman parcialidades
`COMPLETADA` por `fechaRealizacion` (y `cuentaOrigen` para el saldo por cuenta),
en lugar de `OperationReturnPayment(RETORNADO, fechaPago)`. La migración de
backfill (una parcialidad por retorno histórico, `fechaRealizacion = fechaPago`)
hace que los totales históricos y los snapshots ya registrados no cambien.

## 7. Migraciones (a mano, en orden — `sistema-operaciones-backend/migrations/`)

1. `2026-09-01_create_operation_return_installments.sql`
2. `2026-09-01_add_parcialmente_retornado_return_status.sql` (ENUM)
3. `2026-09-01_extend_notification_enums_installments.sql` (ENUM)
4. `2026-09-01_backfill_return_installments.sql` (datos, idempotente)
5. `2026-09-02_add_evidencia_importe_preparado_installment.sql` (columna nullable)
6. `2026-09-03_add_persona_que_recibio_efectivo_installment.sql` (columna nullable,
   `VARCHAR(200)`; compatible con parcialidades históricas — no toca datos ni estados)
7. `2026-09-04_add_confirmado_por_installment.sql` (columna nullable `BIGINT` +
   FK a `users`; parcialidades históricas `COMPLETADA` no se recalculan — sin
   backfill)
8. `2026-09-05_add_recibio_persona_autorizada_installment.sql` (columna nullable
   `BIT`; sin backfill)
