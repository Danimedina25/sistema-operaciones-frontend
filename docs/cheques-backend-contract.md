# Cheques recibidos de clientes: contrato requerido

Estado: backend implementado y verificado en `/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones`. Ver `docs/cheques.md` y `migrations/2026-09-20_cheques_recibidos.sql` en ese repositorio. Pasaron 192 pruebas del backend y 32 pruebas de integración/contrato en MySQL temporal. Quedan pendientes la migración y el despliegue en el entorno de trabajo; no se han ejecutado sobre producción. Ningún saldo se modifica localmente ni se llama al movimiento manual CHEQUE de Caja General.

## Captura

POST /api/operations/payments, edición y creación deben aceptar para CHEQUE `cuentaDestinoId: null`, `numeroCheque`, `bancoEmisor`, `emisor`, `beneficiario`, además de los campos actuales. Los cuatro datos del cheque son obligatorios, cadenas recortadas no vacías. La respuesta OperationPaymentResponse añade esos campos y `chequeEstado` nullable. cuentaDestinoId y los textos de cuenta son nullable. Un cheque nuevo crea un único registro POR_COBRAR ligado al pago. La API no acepta destino, estado, fecha de cobro ni validación del socio. Alta/edición de transferencia y depósito conservan su cuenta obligatoria. No exigir cuentas para recibir cheques.

Bloquear edición ordinaria del pago después de POR_COBRAR, incluso cambiar su tipo; bloquear eliminación de operaciones que contengan movimientos contabilizados salvo reversión explícita. Cheques antiguos sin conciliación no son editables desde el flujo nuevo.

## Lectura

Todos los endpoints usan el envelope actual `{success, message, data, errors}`. Los tipos exactos del cliente están en src/modules/cheques/types.ts.

- GET /api/operations/cheques: filtros `estados` (CSV, vacío=todos), `busqueda` (número y datos del cheque), `cliente` (nombre), `operacionId`, `banco` (emisor), `desde`, `hasta` (fechas de recepción inclusivas), `page` (base cero). Página de tamaño fijo 20 con orden estable por fecha de recepción e id descendentes. Devuelve content, totalPages, totalElements, totales. Totales agrupados por moneda, sobre todos los resultados filtrados, sin paginación y excluyendo exclusivamente el filtro de estados. No sumar monedas distintas.
- GET /api/operations/cheques/by-payment/{paymentId}: Cheque completo con versión, historial ordenado cronológicamente, comprobantes, cuenta histórica etiquetada y requiereConciliacion. No inventar POR_COBRAR para históricos desconocidos: estado=null, requiereConciliacion=true.
- Roles de lectura: ADMIN, JEFA_CUENTAS, AUXILIAR_CUENTAS, JEFA_CAJAS, GERENTE, DIRECCION. Respetar el ámbito de acceso a operaciones. El socio ve el estado del pago en el detalle de su operación, sin acceso a gestión.

## Comando único

POST /api/operations/cheques/{id}/actions recibe ChequeCommand y devuelve Cheque actualizado. Campos comunes: requestId UUID, version, accion, fecha YYYY-MM-DD. La fecha es efectiva, interpretada en la zona del negocio. Rechazar fechas imposibles/futuras y respetar periodos cerrados.

| Acción | Desde | Hasta | Rol | Datos adicionales |
|---|---|---|---|---|
| DEPOSITAR | POR_COBRAR | DEPOSITADO | ADMIN / JEFA_CUENTAS / AUXILIAR_CUENTAS | cuentaDestinoId activa, comprobanteUrl |
| COBRAR_BANCO | POR_COBRAR / DEPOSITADO | COBRADO | ADMIN / JEFA_CUENTAS | cuentaDestinoId activa, comprobanteUrl |
| ASIGNAR_COBRO_EFECTIVO | POR_COBRAR | PENDIENTE_COBRO_EFECTIVO | ADMIN / JEFA_CUENTAS | observación opcional; notifica a Caja y no crea ingreso |
| CONFIRMAR_COBRO_EFECTIVO | PENDIENTE_COBRO_EFECTIVO | COBRADO | ADMIN / JEFA_CAJAS | diaCajaId abierto, denominaciones, comprobanteUrl |
| DEVOLVER_A_CUENTAS | PENDIENTE_COBRO_EFECTIVO | POR_COBRAR | ADMIN / JEFA_CAJAS | motivo; mantiene el pago pendiente |
| RETIRAR_COBRO_EFECTIVO | PENDIENTE_COBRO_EFECTIVO | POR_COBRAR | ADMIN / JEFA_CUENTAS | motivo; retira la tarea de Caja |
| DEVOLVER | DEPOSITADO | DEVUELTO | ADMIN / JEFA_CUENTAS | motivo |
| CANCELAR | POR_COBRAR | CANCELADO | ADMIN / JEFA_CUENTAS | motivo |

Para el depósito previo, precargar cuenta; cualquier cambio al confirmar requiere validar el destino real y registrar cuenta anterior/nueva en auditoría. No aceptar cuenta en cobro de efectivo. No aceptar denominaciones en cobro bancario. Validar que comprobantes pertenezcan al contexto autorizado. Aplicar permisos de servidor, no confiar en campos ni roles enviados por cliente. CashDay debe seguir abierto, corresponder al periodo efectivo y estar autorizado al confirmar. Sumar denominaciones en centavos exactamente al monto; no admitir negativos, fracciones de piezas ni valores no finitos.

## Transacción, idempotencia y saldos

Bloquear el cheque o comparar version de forma atómica. Guardar requestId y hash del cuerpo con restricción única; el mismo requestId/cuerpo devuelve la misma respuesta sin nuevo movimiento, y otro cuerpo devuelve 409. Resolver replay antes de rechazar por versión, pero después de autorizar. Garantizar unicidad del movimiento de cobro por cheque, incluso con dos requestId distintos. Versión obsoleta devuelve 409 sin efectos. Error completo revierte cheque/pago/movimiento/historial juntos. El cliente conserva el mismo cuerpo y requestId para reintentos tras respuesta incierta.

Recibir, depositar y asignar a Caja no generan saldo disponible. ASIGNAR_COBRO_EFECTIVO solo cambia la responsabilidad y notifica a JEFA_CAJAS; DEVOLVER_A_CUENTAS permite reportar un intento fallido sin rechazar el pago. Confirmar cobro cambia pago a VALIDADA una sola vez y contabiliza exactamente una entrada bancaria o una entrada en caja. DestinoCobro=CUENTA_BANCARIA/EFECTIVO; tipoPago permanece CHEQUE. El efectivo de un cliente NO usa el concepto manual CHEQUE (retiro de banco propio). Usa COBRO_CHEQUE_CLIENTE, vinculado al pago/cheque, sin salida bancaria. La UI de caja puede leer ese concepto histórico sin ofrecerlo como captura manual.

El estado de revisión y el de cobro son independientes: mientras POR_COBRAR o DEPOSITADO, el pago no es VALIDADA ni habilita retornos/comisiones por ingreso realizado. DEVUELTO/CANCELADO se relaciona con RECHAZADA, conserva auditoría y libera el importe para registrar un pago sustituto; nunca borra el adeudo. El endpoint genérico /payments/{id}/validate, rechazar, liberar y cambiar estado debe rechazar CHEQUE, enviándolo al comando especializado.

Revisar cálculos de saldo registrado, pendiente por registrar y cobrado: pendientes reservan importe registrado para no duplicar captura, sin reducir deuda efectivamente cobrada; rechazados liberan la reserva. Retornos y comisiones que dependan de cobro confirmado se habilitan solo después del cobro. Cortes muestran cheques recibidos/depositados por separado del efectivo y bancos; cobro cuenta una vez en el destino. No recalcular históricos ni duplicar ingreso al convertir el documento en disponible.

## Históricos y reversión

Inventariar pagos CHEQUE, movimientos de banco/caja y enlaces existentes. No derivar estado de cuenta asociada, validado=true ni fecha de validación. Conciliar evidencia contra estado de cuenta/comprobante y contabilización existente. Vincular el movimiento existente, marcar estado verificado, registrar responsable/evidencia y evitar generar un segundo movimiento. Desconocidos quedan requiereConciliacion=true, sin comandos. No migrar masivamente a COBRADO.

COBRADO, DEVUELTO y CANCELADO son terminales en esta primera interfaz. Un error posterior a cobro requiere proceso de reversión supervisada y auditada que compense el movimiento original y sus consecuencias, nunca una edición o eliminación. No se ha añadido una acción de reversión sin contrato autorizado.

## Integración y verificaciones pendientes en servidor

Pruebas obligatorias con base de datos: alta sin cuenta y sin efectos; depósito sin saldo; cada destino genera una sola entrada correcta; permisos de todos los roles; mismo requestId repetido; dos peticiones simultáneas con distinta clave; rollback ante fallo; caja cerrada concurrentemente; cuenta desactivada; importes/denominaciones inválidos; cheques conciliados e históricos bloqueados; rechazo por endpoints genéricos; saldos de operación, comisiones, cortes y retornos. Estas garantías no pueden verificarse con tests de frontend.

El frontend invalida consultas financieras tras comandos exitosos y refresca el detalle abierto mediante cheque-updated. El módulo informa errores reales de API (sin registros simulados). Los cambios ajenos de notificaciones en el workspace no forman parte de esta implementación.

## Decisiones del contrato implementado

- `Cheque.id` coincide con `pagoId`; el cheque reside en la misma fila del pago y tiene estado, versión e historial separados.
- Moneda MXN, coherente con el modelo actual de importes del backend; no se habilitó captura multidivisa.
- Cambiar un cheque a otro medio requiere cancelarlo y registrar el pago sustituto. Sus datos pueden editarse mientras siga POR_COBRAR.
- Los comprobantes nuevos deben pertenecer a la ruta Firebase Storage `comprobantes/operaciones/{operacionId}/...`, que ya genera este frontend.
- La fecha efectiva no puede ser anterior a la recepción/depósito ni futura. Para efectivo debe coincidir con la caja abierta del día; para banco no puede afectar cortes cerrados actuales o posteriores.
- `estados` vacío consulta todos; ausente usa pendientes y depositados. Los históricos sin estado aparecen al consultar todos y permanecen bloqueados para conciliación.
- Sin cambios necesarios de nombres de endpoints o campos en el frontend. La instancia temporal de pruebas no forma parte de la configuración de ejecución del backend.
