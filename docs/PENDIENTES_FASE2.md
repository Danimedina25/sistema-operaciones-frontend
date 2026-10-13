# Pendientes para la fase 2

## Caja General

- **Envíos de efectivo de Caja a una cuenta bancaria.** El frame `144:2551` los muestra en Salidas, pero el backend actual solo admite movimientos manuales de efectivo sin banco ni cuenta (`CashGeneralService.createMovement` y `resolveBankAccount`). El flujo de depósito en tránsito y su confirmación por Cuentas requiere escrituras y reglas nuevas; esta migración solo permite lecturas nuevas. La pestaña de envíos queda oculta hasta implementar ese flujo. Salidas conserva los retornos por solicitud y las entregas programadas. La ruta histórica de Caja permanece disponible.

## Gerencia y Dirección

- **Configuración completa.** El frame `180:2255` incluye umbral de concentración, horas para operación detenida, día de pago de comisiones y alertas de campana. La tabla y API actuales de `configuracion_general` solo guardan el porcentaje de comisión de oficina. Los demás controles quedan ocultos hasta ampliar persistencia y reglas de negocio; Gerente y Director mantienen el formulario de porcentaje que ya existe.
- **Concentración del dashboard de Dirección.** El indicador del frame `177:1215` debe usar el umbral de configuración; se oculta mientras no exista ese valor en la API. No se usa un porcentaje fijo en la interfaz.
- **Permisos de Usuarios.** El frame `179:2079` ofrece «Nuevo usuario» al Director; la interfaz actual lo ofrece solo a Admin, mientras el backend admite también a Gerente y Director. Esta migración conserva los botones visibles por rol; la alineación de permisos acordada en CLAUDE.md requiere una tarea de seguridad independiente.
- **Reportes y Bitácora.** Los frames `178:1924` y `178:2165` requieren consultas y almacenamiento de bitácora que aún no existen. Se mantienen ocultos en el menú hasta poder mostrar datos reales.

## Retornos

- **Cuenta o CLABE en transferencias.** La regla acordada permite capturar número de cuenta **o** CLABE. El recorrido local de la etapa 7 mostró que `ReturnsOperationServiceImpl.validateReturnRequest` rechaza una solicitud con solo número de cuenta y exige CLABE de 18 dígitos. Corregir esta validación de escritura y cubrirla con pruebas de permisos y negocio en Fase 2.

