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
- `PROGRAMADA` — efectivo/RST con recolección agendada. No cuenta.
- `ENTREGADA` — el socio confirmó la recepción, falta cierre de JEFA_CAJAS. No cuenta.
- `COMPLETADA` — confirmada/realizada. **Única que cuenta como retornado.**
- `CANCELADA` — cancelada antes de completarse. Libera el saldo.

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
| `PATCH /installments/{installmentId}/confirm` | SOCIO_COMERCIAL (dueño) | — | `PROGRAMADA → ENTREGADA` |
| `PATCH /installments/{installmentId}/deliver` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | `{ comprobanteEntregaUrl, personaQueRecibioEfectivo }` | `ENTREGADA → COMPLETADA` + evidencia + persona autorizada que recibió (misma transacción) |
| `PATCH /installments/{installmentId}/cancel` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS, JEFA_CUENTAS, AUXILIAR_CUENTAS | `{ motivo }` | `PROGRAMADA/ENTREGADA → CANCELADA` |
| `GET /installments/today-deliveries?fecha&tipoPago` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | — | `Page<ReturnInstallment>` (PROGRAMADA/ENTREGADA por `fechaHoraRecoleccion`) |
| `GET /installments/late` | ADMIN, GERENTE, DIRECCION, JEFA_CAJAS | — | `Page<ReturnInstallment>` (PROGRAMADA con recolección vencida) |

`ReturnInstallment` incluye datos de la solicitud/operación para listados:
`returnRequestMonto`, `returnRequestEstatus`, `clienteNombre`,
`socioComercialNombre`, `socioComercialTelefono`, `autorizadoParaRecibir1..3`.

`personaQueRecibioEfectivo` (string | null): persona autorizada que recibió
físicamente el efectivo / realizó el retiro sin tarjeta. Se guarda el nombre
canónico registrado en la solicitud (no el texto del cliente). `null` en
parcialidades históricas cerradas antes de esta funcionalidad → el frontend
muestra "No registrado (entrega histórica)". Es **distinta** de
`entregadoPorNombre` (usuario interno del sistema que cerró la entrega).
Etiquetas de UI: "Persona que recibió" (efectivo) / "Persona que realizó el
retiro" (retiro sin tarjeta).

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
7. Cancelar solo aplica a parcialidades no completadas; recalcula solicitud y
   operación. Cancelar la última activa devuelve la solicitud a `SOLICITADO`.
8. **Cierre de entrega (`/deliver`)** — efectivo / retiro sin tarjeta,
   `ENTREGADA → COMPLETADA`. Se valida todo antes de mutar nada:
   - `comprobanteEntregaUrl` presente y no vacío
     (`ReturnInstallmentReceiptRequiredException`, 400).
   - `personaQueRecibioEfectivo` presente y no vacía
     (`ReturnInstallmentReceiverRequiredException`, 400).
   - La solicitud tiene al menos un autorizado
     (`autorizadoParaRecibirEfectivo1..3`); si no,
     `ReturnInstallmentNoAuthorizedRecipientsException`, 400 —
     "Esta solicitud no tiene personas autorizadas para recibir."
   - La persona enviada coincide con un autorizado comparando sin distinguir
     mayúsculas, espacios repetidos ni acentos; si no,
     `ReturnInstallmentReceiverNotAuthorizedException`, 400 —
     "La persona seleccionada no está autorizada para recibir esta entrega."
   - Se persiste el **nombre canónico** de la solicitud, no el texto recibido.
   - Método distinto de efectivo/RST o estatus distinto de `ENTREGADA` →
     `ReturnInstallmentInvalidStatusException`, 400 (sin cambiar estado).
   - La transición es transaccional e idempotente: un segundo `/deliver` sobre
     una parcialidad ya `COMPLETADA` falla por el chequeo de estatus y no
     modifica datos.
   - Cualquier validación fallida deja intactos estatus y totales.

## 5. Notificaciones (`NotificationType`, módulo `PAGOS`, `referenceType` `RETURN_INSTALLMENT` o `PAYMENT_OPERATION`)

- `RETURN_INSTALLMENT_SCHEDULED` / `RETURN_INSTALLMENT_CODE_AVAILABLE` — recolección
  programada (efectivo/RST) → socio.
- `RETURN_INSTALLMENT_DELIVERED` — el socio confirmó, cerrar → JEFA_CAJAS/ADMIN.
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
