# Caja General — Fase 1

Implementación en el frontend y en el backend `Sistema de Operaciones`, módulo `com.sistemadeoperaciones.cajageneral`. Ruta de navegación: `/caja-general`.

## Alcance implementado

- Una única caja abierta. Apertura por fecha y desglose de las once denominaciones: $1,000, $500, $200, $100, $50, $20, $10, $5, $2, $1 y $0.50.
- Cada apertura posterior hereda automáticamente el saldo contado y el desglose completo del último corte cerrado. Los valores se muestran prellenados y protegidos para que el usuario solo los revise y confirme; únicamente la primera apertura se captura manualmente.
- Entradas y salidas de efectivo físico con tres conceptos: `EFECTIVO`, `CHEQUE` cobrado y `RETIRO_CON_TARJETA`. El cheque cobrado exige una **cuenta bancaria real y activa** del sistema, identificada por `bankAccountId`, y sólo existe como entrada; el retiro con tarjeta conserva el catálogo fijo de nombres de banco. Transferencias, depósitos y retiros sin tarjeta se rechazan porque no incorporan efectivo físico a esta caja.
- La UI v2 presenta saldo y totales diarios en un hero, separa el ciclo de apertura/cierre de los movimientos, muestra el progreso Apertura → En operación → Cierre y permite expandir una sola acción a la vez. El importe de cada movimiento y del cierre se calcula directamente desde las once denominaciones.
- Los retornos `EFECTIVO` generan automáticamente su salida cuando la Jefa de Cajas registra la entrega física. Ese modal exige el desglose exacto; entrega y salida se guardan en la misma transacción. Si no hay caja abierta del día, falta saldo o el desglose no coincide, ninguna de las dos operaciones se confirma. El importe se lee de la FK: `monto_manual` queda **NULL** y la referencia es única.
- Libro por día/rango con concepto, entrada, salida y saldo acumulado; apertura, resumen diario, detalle por denominación, vínculo a operación y comprobante. Muestra los saldos originales, no reinicia el acumulado al filtrar.
- Cierre con saldo esperado, contado, diferencia y explicación obligatoria si existe diferencia. Día cerrado inmutable; la siguiente apertura debe ser posterior y comenzar con el importe contado anterior. No se introduce un ajuste de efectivo automático ni se borra la diferencia.
- Registro de usuario y fecha para apertura, movimientos y cierre. Administración y Jefa de Cajas pueden registrar; Gerencia y Dirección consultan. Autorización en backend y guardas/menú en frontend.
- Solo Administración puede eliminar un corte de cualquier fecha. La confirmación exige escribir `ELIMINAR`, indicar el motivo y trabajar sobre la versión consultada. Se eliminan el día, movimientos y desgloses, mientras las operaciones/retornos originales permanecen. Una auditoría independiente conserva fecha, saldos, cantidad de movimientos, motivo, usuario y hora de eliminación.

## Cheque cobrado y cuenta bancaria

Cobrar un cheque saca dinero de una cuenta bancaria y lo mete al efectivo físico. Desde
septiembre de 2026 ese movimiento afecta los dos libros: un mismo renglón de
`cash_general_movements` es a la vez la entrada de efectivo y la salida bancaria, así que es
imposible que exista una sin la otra y la idempotencia por `requestId` protege a ambas.

El banco ya no se escribe: se elige la cuenta en un selector buscable que filtra por titular,
banco y número, y que sólo ofrece cuentas activas. El texto `banco` se conserva como snapshot
para que el histórico siga siendo legible. Los movimientos anteriores a este cambio quedan como
"cuenta no vinculada" y no entran al saldo bancario: no se adivina una cuenta a partir del
nombre del banco.

`RETIRO_CON_TARJETA` sigue sin efecto bancario. Representa efectivo ya retirado, pero las
tarjetas no están modeladas y no hay forma de saber de qué cuenta salen; queda pendiente junto
con el inventario de tarjetas de la Fase 2.

El detalle contable completo, la matriz de eventos y la vista de consulta están en
[movimientos-bancarios.md](movimientos-bancarios.md).

## Caja que quedó abierta de un día anterior

Si un día se olvida cerrar la caja, al día siguiente la operación quedaba trabada: no se podía
cerrar la anterior por no ser la de hoy, y no se podía abrir la de hoy porque la anterior seguía
abierta. Ahora **el cierre admite una caja de fecha pasada**; la captura de movimientos sigue
restringida al día actual, así que desde que venció ese día no se le pudo agregar nada y el
efectivo no debería haber cambiado. Si hay diferencia, el cierre la registra y exige explicarla
como siempre. La pantalla avisa de la caja pendiente y ofrece cerrarla antes de abrir la nueva.

## Conteo final prellenado

El cierre llega con el desglose que debería haber en caja —apertura más entradas menos salidas,
denominación por denominación— para que el conteo se revise en lugar de recapturarse. Sigue
siendo editable: lo que manda es el efectivo contado, y de ahí sale la diferencia.

Una denominación puede salir negativa si durante el día se cambió físicamente un billete por
otros: el importe total cuadra con el saldo, pero el detalle no. Esas se prellenan en cero y la
pantalla lo advierte, en vez de bloquear el cierre.

## Integridad

Se usan `BigDecimal` con dos decimales en el backend y centavos enteros para validaciones del frontend. Se rechazan importes fuera de rango, desgloses incompletos, negativos, fraccionados o con suma diferente. La deserialización de cantidades rechaza fracciones antes de que Jackson pueda truncarlas.

Toda escritura toma un bloqueo sobre el registro único de Caja General. El upsert MySQL también protege la primera apertura; usa `ON DUPLICATE KEY UPDATE` para obtener bloqueo exclusivo sin convertir bloqueos compartidos de `INSERT IGNORE`. Los movimientos llevan UUID de idempotencia, conservado al reintentar una misma petición. Un UUID reutilizado con distinto contenido se rechaza. El cierre exige la versión del día observada al iniciar el conteo.

La migración `2026-09-14_add_caja_general.sql` crea tablas, FK, unicidad y restricciones `CHECK`. No importa información histórica. La FK de parcialidad impide eliminar una fuente vinculada. La aplicación también funciona con `ddl-auto=update`; para contar con todas las restricciones SQL descritas, ejecutar la migración **antes** del primer inicio que cree estas tablas. `CREATE TABLE IF NOT EXISTS` no incorpora checks retroactivamente a tablas previamente creadas por Hibernate.

## Fuentes revisadas y reutilización

Se leyeron ambos Excel y el Word originales. El Excel de caja incluye inicio, entradas, salidas y corte total con desglose por bloque; el libro de movimientos conserva la secuencia de saldos. Se conservan las once denominaciones y los ocho grupos bancarios, incluyendo las variantes de Scotiabank. Los nombres de ejemplo del cliente no se incorporaron como datos del sistema.

Se reutilizan `OperationReturnInstallment`, `PaymentType`, los roles existentes, `AuthenticatedUserService`, `ApiResponse`, las excepciones comunes, JPA/transacciones, Axios, React Query, `useTableFilters`, `TableFilterSection`, `DateRangeCalendarField`, `FileUploadField`, carga existente a Firebase, enlaces a operaciones y el diseño visual de operaciones/corte. No se agregan dependencias.

`PaymentType.RETIRO_SIN_TARJETA` en el sistema actual es un retorno al cliente con cuenta bancaria de origen y código propio; no equivale a una salida de Caja General y no se registra automáticamente allí. El concepto manual `RETIRO_CON_TARJETA` representa efectivo ya retirado que entra o sale físicamente y exige seleccionar banco. La relación con el futuro inventario de tarjetas queda pendiente de Fase 2.

## API

Todas las respuestas usan `ApiResponse<T>`. Los DTO de escritura y lectura están separados.

| Método | Ruta bajo `/api/caja-general` | Uso |
| --- | --- | --- |
| GET | `/latest` | Última caja; `data: null` si aún no existe |
| GET | `/ledger?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Libro por rango de hasta un año |
| POST | `/days` | Apertura |
| POST | `/days/{id}/movements` | Entrada/salida, UUID de petición obligatorio; `bankAccountId` obligatorio para cheque cobrado |
| POST | `/days/{id}/close` | Cierre, versión obligatoria |

Las denominaciones se envían como mapa completo `D1000`…`D1`, `D050`, con cantidades enteras y cero donde no aplique. La pantalla no busca ni vincula entregas de otros módulos; toda captura manual es directa y su monto se deriva del desglose.

## Pendiente / decisiones de negocio

Fase 2 no implementada: lotes de cheques, inventario y entrega de tarjetas, relación tarjeta–persona–retiro, y los tres formatos imprimibles del Word.

- `TODO: confirmar con negocio` excepciones al desglose por movimiento. Por ahora se exige en todos los movimientos físicos, como en el Excel.
- `TODO: confirmar con negocio` migración histórica. Se inicia sin importar los Excel; la primera apertura captura el saldo inicial.
- `TODO: confirmar con negocio` PDF descargable o impresión del navegador. La opción inicial propuesta para Fase 2 es una vista compartida con CSS de impresión y `window.print()`: no agrega dependencias y permite guardar como PDF desde el navegador. Quedan pendientes implementación y validación de paginado/fidelidad de los tres formatos.
- `TODO: confirmar con negocio` historial completo de tarjetas o estado actual. No se crea un catálogo provisional que pierda trazabilidad.

Los TODO también se encuentran en el servicio del backend. Las entregas nuevas en efectivo siguen generando su salida de Caja General desde el flujo transaccional de entrega; ese proceso automático no se expone como una opción de vinculación manual en esta pantalla.

## Validación

- Backend: 97 pruebas aprobadas en total (96 de la suite completa y la prueba adicional de migración), con pruebas de saldo acumulado, sobregiro, cierre exacto/con diferencias, arrastre, duplicados, enlace sin importe duplicado, protección FK, permisos y concurrencia real con H2 en modo MySQL. Prueba adicional del script de migración y sus restricciones sobre una base H2 aislada.
- Frontend: 263 pruebas aprobadas en la suite completa (17 específicas del módulo, repetidas tras el último ajuste), incluyendo importes/monedas, apertura/cierre, versión obsoleta, sobregiro, referencias e idempotencia. TypeScript y build de producción.
- Lint del módulo y archivos de integración sin errores. El lint global reporta 73 errores y 15 advertencias; la misma cantidad se confirmó ejecutando lint sobre una copia limpia de HEAD previa al módulo.

No se ejecutó la migración sobre una base de datos de producción, ni se desplegaron los cambios. Las pruebas de concurrencia y migración usan H2; resta validar el despliegue contra el MySQL del entorno y el flujo de comprobantes con sus credenciales reales.
