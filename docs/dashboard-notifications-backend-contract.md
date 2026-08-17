# Contrato de backend: dashboard, notificaciones y filtros por rol

Este documento describe lo que el backend necesita exponer para completar el
sistema de trabajo guiado por rol descrito en el pedido original. Cubre las
4 fases de implementación del frontend (no solo la Fase 1 ya construida),
para que el equipo de backend pueda planear el trabajo completo de una vez.

El frontend **no simula ni calcula estos datos de forma aproximada**: mientras
un punto de este documento no esté disponible, la funcionalidad
correspondiente permanece deshabilitada, oculta o limitada a lo que sí puede
calcularse con datos reales — nunca se muestran cifras inventadas.

## 1. Filtro por tipo de pago en operaciones (bloqueante para Fase 2)

**Problema:** `GET /api/operations` (y `/api/operations/my-operations`) solo
filtran por `status`, `dateFilter`, `search`, `operationId`, `activo`. No
existe forma de pedir "operaciones con un pago en efectivo pendiente de
validación" ni "operaciones con un pago bancario pendiente de validación" sin
descargar todas las operaciones y revisar el arreglo `pagos` en el cliente —
lo cual es incorrecto sobre una página incompleta y fue evitado a propósito.

**Bloquea:**
- JEFA_CAJAS — filtro predeterminado de "efectivo pendiente" al entrar a Operaciones.
- JEFA_CAJAS — contador de ingresos en efectivo pendientes.
- AUXILIAR_CUENTAS / JEFA_CUENTAS — vista directa de comprobantes bancarios pendientes.
- AUXILIAR_CUENTAS / JEFA_CUENTAS — contador de comprobantes pendientes.

**Propuesta:** agregar query params opcionales a `GET /api/operations`:

```
paymentType=EFECTIVO|TRANSFERENCIA|DEPOSITO|CHEQUE|RETIRO_SIN_TARJETA
paymentStatus=PENDIENTE_VALIDACION|VALIDADA|RECHAZADA
```

que filtren operaciones que contengan al menos un pago con ese tipo/estatus, o
alternativamente un endpoint dedicado a nivel de pago:

```
GET /api/operations/payments?paymentType=EFECTIVO&paymentStatus=PENDIENTE_VALIDACION&page=&size=
```

que devuelva pagos individuales (no operaciones) con la información mínima
para renderizar la lista y el contador vía `totalElements`.

## 2. Endpoints de resumen agregado (bloqueante para Fase 2–3)

Todos estos deben calcularse en el servidor sobre el total de registros, no
sobre una página. Se listan agrupados por quién los consume:

### 2.1 Resumen por rol (Fase 2)
`GET /api/dashboard/summary` (o por rol, ej. `/api/dashboard/summary/socio-comercial`)
- SOCIO_COMERCIAL: comprobantes rechazados, operaciones con saldo pendiente por
  registrar, operaciones listas para solicitar retorno, retornos pendientes de
  confirmar, comisiones pendientes/disponibles.
- JEFA_CAJAS: total entregado hoy, total pendiente hoy, número de entregas,
  próxima recolección, cantidad pendiente de confirmación del socio.
- AUXILIAR_CUENTAS / JEFA_CUENTAS: total de comprobantes bancarios pendientes.

### 2.2 Comparativos por periodo (Fase 3, GERENTE/DIRECCION/ADMIN)
`GET /api/dashboard/comparatives?period=TODAY|THIS_WEEK|THIS_MONTH&compareTo=PREVIOUS`
Debe devolver, por métrica (volumen operado, pagos pendientes, retornos
pendientes, comisiones pendientes): valor actual, valor anterior. El cálculo
de variación porcentual y manejo de división entre cero ya está resuelto en el
frontend (`shared/utils/comparatives.ts`), el backend solo necesita entregar
los dos valores.

### 2.3 Ranking de socios comerciales (Fase 3, GERENTE)
`GET /api/dashboard/commercial-partners-ranking?period=...`
Por socio: número de operaciones, monto operado, comisiones generadas. El
frontend ordena y calcula posición/porcentajes.

### 2.4 Resumen diario de caja (Fase 2, JEFA_CAJAS)
Los endpoints existentes (`/api/daily-cash-cuts`, `/api/bank-account-daily-cuts`)
no exponen "próxima recolección" ni "cantidad pendiente de confirmación del
socio". Se requiere agregar estos dos valores al resumen diario existente o
crear `GET /api/daily-cash-cuts/summary?fecha=`.

### 2.5 Listado de excepciones (Fase 3, DIRECCION/ADMIN)
`GET /api/dashboard/exceptions?type=REJECTED_PAYMENTS|LATE_RETURNS|STALLED_OPERATIONS|PENDING_COMMISSIONS`
Debe soportar paginación y filtrar por tipo. El frontend no puede construir
este listado combinando llamadas existentes sin descargar todo.

### 2.6 Distribución de volumen y concentración (Fase 3, DIRECCION/ADMIN)
`GET /api/dashboard/volume-distribution?period=...` — por socio: monto total,
número de operaciones. El cálculo de porcentaje del total, concentración del
principal socio y de los 3 principales ya está resuelto en el frontend
(`shared/utils/concentration.ts`), solo falta el dato agregado de origen.

## 3. Operaciones detenidas (Fase 3, GERENTE)

No requiere endpoint nuevo: el frontend puede calcular "sin cambios en más de
N horas" a partir de `updatedAt` ya expuesto en `PaymentOperationResponse`,
combinado con el listado existente. Se documenta aquí porque el umbral (48h
por defecto) es configurable solo en frontend por ahora — si se requiere que
sea configurable por el negocio, debe exponerse en
`/api/configuraciones` o similar.

**Limitación aceptada:** mientras no exista un historial de eventos por
operación, "detenida" se basa en `updatedAt`, que puede cambiar por razones no
relacionadas con el flujo de la operación (ej. campos administrativos). Se
usa la interpretación más restrictiva posible y se declara explícitamente en
la UI que se basa en `updatedAt`.

## 4. Nuevos tipos de notificación

El tipo `NotificationType` actual (`src/modules/notifications/types/notifications.types.ts`)
soporta: `OPERATION_CREATED`, `PAYMENT_SUBMITTED`, `PAYMENT_VALIDATED`,
`PAYMENT_REJECTED`, `OPERATION_STATUS_CHANGED`, `SYSTEM_ALERT`. Se requieren
dos tipos adicionales:

### 4.1 `CASH_RETURN_REQUESTED` (resuelto)
- **Se genera:** al solicitar un retorno cuyo `tipoPago` sea `EFECTIVO` o
  `RETIRO_SIN_TARJETA` (`POST /api/operations/returns/:operationId/request`),
  en `ReturnsOperationServiceImpl.sendCashReturnRequestedNotification`.
- **Destinatarios:** `JEFA_CAJAS` y `ADMIN` (`createForRoles`) — se mantuvo
  `ADMIN` porque ya era el comportamiento existente del alerta genérico que
  este tipo reemplaza para el caso de efectivo; no es un cambio de negocio
  nuevo.
- **referenceType:** `RETURN_PAYMENT` (agregado a `NotificationReferenceType`).
- **referenceId:** id del primer `ReturnPaymentResponse` del lote solicitado.
- **actionUrl:** `/retornos-por-pagar/:operationId`.
- **Prioridad:** `MEDIUM`.
- Los retornos por transferencia/depósito siguen notificando a
  `JEFA_CUENTAS`/`AUXILIAR_CUENTAS`/`ADMIN` con `SYSTEM_ALERT` (sin cambios,
  fuera del alcance de este tipo).

### 4.2 `COMMISSION_PAID`
- **Se genera:** al pagar una comisión (`PATCH
  /api/commercial-partner-commissions/:id/pay` o `POST .../pay-batch`).
- **Destinatarios:** el usuario beneficiario de la comisión pagada
  (`SOCIO_COMERCIAL` o el usuario nivel correspondiente).
- **Payload sugerido:** `{ commissionId, monto, semana, referenciaPago }`.
- **referenceType:** `COMMISSION` (nuevo valor a agregar).
- **referenceId:** id de la comisión pagada.
- **actionUrl:** `/mis-comisiones` con la semana correspondiente como query
  param (ej. `/mis-comisiones?semana=2026-W03`) para que el frontend abra
  directamente esa semana.
- **Prioridad:** `MEDIUM`.
- **Deduplicación:** una notificación por pago de comisión (no por cada
  comisión individual si se paga en lote — se recomienda una notificación
  agregada por lote con el monto total, para no saturar al socio).

### 4.3 Navegación por `referenceType`/`referenceId`
Hoy el frontend navega únicamente usando `actionUrl` (string ya resuelto por
el backend); `referenceType`/`referenceId` se reciben pero no se usan para
construir rutas. Mientras el backend garantice `actionUrl` correcto para los
tipos nuevos, esto es suficiente. Si se prefiere que el frontend resuelva la
ruta a partir de `referenceType`/`referenceId` (más resiliente a cambios de
URL), es un cambio de frontend que no requiere backend adicional, pero se
documenta aquí porque afecta el contrato: `referenceType`/`referenceId` deben
ser siempre consistentes con `actionUrl` en el mismo evento.

## 5. Rechazo de pagos: motivo estructurado y metadata

Actualmente `PATCH /api/operations/payments/:id/reject` solo acepta
`observaciones` (string libre) en `UpdatePaymentStatusRequest`. El frontend ya
compone un texto legible con motivo predefinido + contexto libre (Fase 1) y lo
envía en ese mismo campo por compatibilidad. Se sugiere, para el futuro:

- Confirmar si `validadoPorId`/`validadoPorNombre`/`fechaValidacion` en
  `OperationPaymentResponse` se reutilizan también cuando el pago se rechaza
  (es decir, si representan "quién y cuándo cambió el estatus" en general).
  Si no es así, se necesitan campos equivalentes para rechazo
  (`rechazadoPorId`, `rechazadoPorNombre`, `fechaRechazo`) para poder mostrar
  "quién rechazó y cuándo" en el detalle de la operación (Fase 2).
- Opcionalmente, aceptar un campo `motivoRechazoCodigo` estructurado además de
  `observaciones`, para reportes futuros sin depender de parsear texto libre.

## 6. Versionado de comprobantes al corregir un pago rechazado

Cuando un socio corrige un comprobante rechazado (usa el formulario de edición
existente, `PUT /api/operations/payments/:paymentId`), se debe confirmar si el
backend **conserva** el comprobante anterior o lo sobrescribe. Si lo
sobrescribe, se pierde la evidencia del comprobante que motivó el rechazo. Se
solicita:
- Conservar un historial de comprobantes por pago (aunque sea solo URL +
  fecha), o
- Exponer explícitamente que la sobrescritura es intencional, para que el
  frontend pueda advertir al usuario antes de reemplazar el archivo.

## 7. Confirmación del socio en retornos en efectivo (semáforo de entregas) (resuelto)

`OperationReturnPayment` ahora tiene una columna dedicada
`fecha_confirmacion_recoleccion` (nullable), distinta de `fechaEntrega`
(cuándo JEFA_CAJAS entregó físicamente) y del `fechaPago` heredado (que para
el flujo de efectivo ya se reutilizaba con este mismo significado, pero de
forma ambigua). `PATCH .../confirm-cash-pickup` la llena junto con `fechaPago`
al confirmar el socio. Se expone como `fechaConfirmacionRecoleccion` en
`ReturnPaymentResponseDto`. La clasificación del semáforo
(`shared/utils/delivery-classification.ts`) ya distinguía "entregado, pendiente
de confirmar" de "confirmado" usando solo `estatus` (`ENTREGADO` vs
`RETORNADO`), así que no requirió cambios; el campo nuevo se usa en
`ReturnPaymentDetailModal.tsx` para mostrar la fecha/hora exacta de la
confirmación del socio.

## 8. Teléfono de contacto para WhatsApp directo (resuelto)

`User` ahora expone `telefono` (nullable, hasta 20 caracteres). Es obligatorio
al crear/editar usuarios con rol `SOCIO_COMERCIAL`, `JEFA_CAJAS`,
`JEFA_CUENTAS` o `AUXILIAR_CUENTAS` (`TelefonoRequiredException` si falta), y
se expone en `UserResponseDto.telefono`. `ReturnPaymentResponseDto` incluye
`socioComercialTelefono`, usado en "Entregas de hoy" para que el botón
"Avisar por WhatsApp" abra `https://wa.me/<telefono>?text=...` directo al
socio comercial dueño de la operación. El botón "Compartir por WhatsApp" de
`OperationDetailCard` sigue **sin destinatario** a propósito: ese mensaje lo
comparte el socio comercial hacia quien él elija (típicamente su cliente), no
hacia sí mismo.

## 9. Resumen de prioridad sugerida

| Item | Bloquea | Prioridad |
|---|---|---|
| §1 Filtro por tipo de pago | JEFA_CAJAS, AUXILIAR_CUENTAS, JEFA_CUENTAS (Fase 2) | Alta |
| §2.1 Resumen por rol | Todos los dashboards (Fase 2) | Alta |
| §7 Confirmación de recolección | Semáforo de entregas (Fase 2) | Resuelto |
| §5 Metadata de rechazo | Detalle de rechazo destacado (Fase 2) | Media |
| §2.2–2.6 Comparativos/ranking/excepciones/concentración | GERENTE/DIRECCION/ADMIN (Fase 3) | Media |
| §4 Nuevos tipos de notificación | Alertas en tiempo real (Fase 4) | Resuelto |
| §6 Versionado de comprobantes | Integridad de evidencia (transversal) | Media |
| §8 Teléfono de contacto | Envío directo de WhatsApp (mejora opcional) | Baja |
