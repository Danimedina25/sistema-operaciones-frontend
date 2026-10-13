# Pendientes para la fase 2

## Caja General

- **Observaciones de apertura.** El frame C5 (`23:1072`) incluye el campo «Observaciones de la apertura», pero `OpenCashDay` y el endpoint de apertura no reciben ni guardan observaciones. El campo queda oculto hasta ampliar el contrato y la persistencia; las observaciones del cierre sí se conservan.
- **Diferencia en el conteo inicial.** El backend de `CashGeneralService.open` exige que el saldo inicial coincida exactamente con el contado del último cierre. C5 permite revisar las denominaciones heredadas, pero una diferencia real de importe no puede registrarse durante la apertura con el contrato actual. Se permiten correcciones de denominación que conservan el total; resolver diferencias de importe requiere una decisión de negocio y cambios en backend.
- **Envíos de efectivo de Caja a una cuenta bancaria.** El frame `144:2551` los muestra en Salidas, pero el backend actual solo admite movimientos manuales de efectivo sin banco ni cuenta (`CashGeneralService.createMovement` y `resolveBankAccount`). El flujo de depósito en tránsito y su confirmación por Cuentas requiere escrituras y reglas nuevas; esta migración solo permite lecturas nuevas. La pestaña de envíos queda oculta hasta implementar ese flujo. Salidas conserva los retornos por solicitud y las entregas programadas. La ruta histórica de Caja permanece disponible.
- **Datos de la lista de Entradas.** El frame C2 (`109:2010`) muestra fecha de creación de la operación, antigüedad del comprobante y, en cheques, banco y destino de cobro. `GET /api/cash-work/income` hoy entrega solo `fechaPago`, número y estado del cheque; ampliar su respuesta de lectura para mostrar esos datos sin hacer una consulta por operación en cada fila.
- **Destino del cheque elegido por Cajas.** El frame C2a2 (`165:2273`) permite a la Jefa de Cajas elegir «cobrado en efectivo» o «depositado en cuenta». Hoy el cheque local llega con destino asignado a cobro en efectivo y `allowedChequeActions` solo permite confirmar ese destino. Implementar la elección, sus permisos y la escritura del envío bancario antes de sustituir el gestor actual.
- **Datos de Mis pendientes de Cajas.** El frame C0 (`88:2020`) detalla el cheque o pago más antiguo, la próxima entrega programada y el número de entregas pendientes de confirmación del socio. `GET /api/cash-work/summary` solo entrega `count`, `amount` y `oldest` por grupo; ampliar la respuesta de lectura para completar esas líneas sin inferirlas en el navegador.

## Gerencia y Dirección

- **Configuración completa.** El frame `180:2255` incluye umbral de concentración, horas para operación detenida, día de pago de comisiones y alertas de campana. La tabla y API actuales de `configuracion_general` solo guardan el porcentaje de comisión de oficina. Los demás controles quedan ocultos hasta ampliar persistencia y reglas de negocio; Gerente y Director mantienen el formulario de porcentaje que ya existe.
- **Concentración del dashboard de Dirección.** El indicador del frame `177:1215` debe usar el umbral de configuración; se oculta mientras no exista ese valor en la API. No se usa un porcentaje fijo en la interfaz.
- **Permisos de Usuarios.** El frame `179:2079` ofrece «Nuevo usuario» al Director; la interfaz actual lo ofrece solo a Admin, mientras el backend admite también a Gerente y Director. Esta migración conserva los botones visibles por rol; la alineación de permisos acordada en CLAUDE.md requiere una tarea de seguridad independiente.
- **Reportes y Bitácora.** Los frames `178:1924` y `178:2165` requieren consultas y almacenamiento de bitácora que aún no existen. Se mantienen ocultos en el menú hasta poder mostrar datos reales.

## Retornos

- **Cuenta o CLABE en transferencias.** La regla acordada permite capturar número de cuenta **o** CLABE. El recorrido local de la etapa 7 mostró que `ReturnsOperationServiceImpl.validateReturnRequest` rechaza una solicitud con solo número de cuenta y exige CLABE de 18 dígitos. Corregir esta validación de escritura y cubrirla con pruebas de permisos y negocio en Fase 2.

