# Pendientes de cajas y cuentas

## Acceso y unidades

`/mis-pendientes` conserva los pendientes del socio y agrega los de JEFA_CAJAS,
JEFA_CUENTAS y AUXILIAR_CUENTAS. Cuentas comparte una cola entre ambos roles.
Los roles simultáneos suman capacidades, sin duplicar las tarjetas bancarias.
El backend verifica cada cola y sigue validando el permiso al realizar una acción.

Las cuatro tarjetas de ingresos/retornos cuentan **operaciones distintas**.
Las dos tarjetas de entregas cuentan **parcialidades**, no solicitudes.

## Consultas de operaciones

Parámetro opcional `workQueue` en `PaymentOperationFilterDto`:

| Cola | Endpoint | Criterio obligatorio y rol |
|---|---|---|
| CASH_INCOME | GET /api/operations | JEFA_CAJAS; un mismo comprobante EFECTIVO y PENDIENTE_VALIDACION |
| BANK_INCOME | GET /api/operations | JEFA_CUENTAS o AUXILIAR_CUENTAS; un mismo comprobante TRANSFERENCIA/DEPOSITO/CHEQUE y PENDIENTE_VALIDACION |
| CASH_RETURNS | GET /api/operations/returns/requested | JEFA_CAJAS; solicitud EFECTIVO/RETIRO_SIN_TARJETA con saldo disponible |
| BANK_RETURNS | GET /api/operations/returns/requested | JEFA_CUENTAS o AUXILIAR_CUENTAS; solicitud TRANSFERENCIA/DEPOSITO/CHEQUE con saldo disponible |

Tipo, estatus y saldo del retorno se evalúan sobre la misma solicitud. Saldo
**disponible para registrar otra parcialidad** = monto solicitado menos la suma
de parcialidades no canceladas (COMPLETADA, PROGRAMADA y ENTREGADA). Una entrega
ya reservada no vuelve a aparecer como dinero por preparar: se atiende en entregas.
Los retornos parcialmente pagados aparecen si aún tienen importe disponible.

Los filtros por fecha corresponden a **creación de la operación**, igual que los
listados actuales. `dateFilter` tiene prioridad sobre startDate/endDate; fechas
vacías significan sin límite. Las colas de ingreso fuerzan activo ACTIVE y
excluyen operaciones concluidas. La consulta de retornos conserva los estados
operativos y filtro activo del listado, y restringe los métodos por los roles
sin filtrar después de paginar. Las restricciones por área se conservan al
quitar `workQueue` en Retornos por pagar para usuarios operativos no administrativos.

## Entregas

Nuevo GET `/api/operations/returns/installments/pending`:

- `queue=TODAY|CONFIRMATION`, requerido.
- `tipoPago=EFECTIVO|RETIRO_SIN_TARJETA`, opcional (ambos si se omite).
- `page`, `size`, `sort`, paginación estándar. Respuesta `ApiResponse<Page<ReturnInstallmentResponseDto>>`.
- Acceso: JEFA_CAJAS (también si tiene otros roles).
- TODAY: fechaHoraRecoleccion de hoy en America/Cancun, sin fechaEntrega ni
  fechaConfirmacion; no usa el período general de Mis pendientes.
- CONFIRMATION: fechaConfirmacion presente y fechaEntrega ausente, de cualquier
  fecha, incluyendo meses anteriores.
- Ambas excluyen CANCELADA, COMPLETADA y operaciones inactivas. ENTREGADA por sí
  sola no identifica quién falta: se revisan las dos marcas independientes.
- Criterios antes de paginar, totalElements global.

Destinos `/entregas-de-hoy?queue=TODAY` y `?queue=CONFIRMATION`: filtros visibles,
paginación de 10 registros y acciones existentes de cierre. El resumen general
histórico de Entregas de hoy sigue disponible en la ruta sin queue.

## Caché, navegación y errores

Las tarjetas y listados usan las mismas claves `work-operations` y
`staff-deliveries`, con identidad de usuario, criterios y paginación. Refrescan
cada 30 segundos y al recuperar foco. Las mutaciones exitosas de /operations
invalidan estas consultas mediante un interceptor registrado una vez al iniciar
la aplicación; una mutación fallida no invalida ni se presenta como exitosa.

Los enlaces tienen prioridad sobre filtros guardados. Se persisten los parámetros
explícitos al recibir el enlace para conservarlos al volver de un detalle. Los
paneles y fechas mantienen caché por usuario. Los errores presentan reintento,
no cero pendientes; no se usa la página anterior como resultado del nuevo período.

## Despliegue

Publicar **backend antes del frontend**, porque workQueue y /installments/pending
son un contrato nuevo. Sin ese backend no deben considerarse verificados los
contadores del frontend. No requiere migración de base de datos.
