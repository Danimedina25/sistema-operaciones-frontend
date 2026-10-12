# Pendientes para la fase 2

## Caja General

- **Envíos de efectivo de Caja a una cuenta bancaria.** El frame `144:2551` los muestra en Salidas, pero el backend actual solo admite movimientos manuales de efectivo sin banco ni cuenta (`CashGeneralService.createMovement` y `resolveBankAccount`). El flujo de depósito en tránsito y su confirmación por Cuentas requiere escrituras y reglas nuevas; esta migración solo permite lecturas nuevas. La pestaña de envíos queda oculta hasta implementar ese flujo. Salidas conserva los retornos por solicitud y las entregas programadas. La ruta histórica de Caja permanece disponible.

