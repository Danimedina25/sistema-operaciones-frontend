# Criterios de los dashboards

## Fechas y fuentes disponibles

| Indicador | Fuente | Fecha aplicada |
|---|---|---|
| Operaciones creadas | `payment_operations` | `createdAt` |
| Creadas en el periodo y actualmente completadas | estado actual de la operación | `createdAt` |
| Monto de operaciones comisionadas | resumen de comisiones y monto de la operación | `createdAt` de la operación |
| Comisiones generadas | comisiones de socios | periodo solicitado por el módulo de comisiones |
| Comisiones pagadas | comisiones de socios pagadas | `paidAt` |
| Saldo bancario actual | corte diario | día actual |
| Operaciones detenidas | operaciones activas no terminales | `updatedAt`, umbral de 48 horas |
| Pendientes del equipo | colas de Cajas y Cuentas | creación de operación; las entregas usan la fecha actual o confirmaciones abiertas |

Los enlaces de cada tarjeta transmiten el mismo rango y estatus que fundamentan su conteo. Las colas de Cajas y Cuentas usan `supervisedRole`; no incluyen pendientes de socios comerciales.

## Métricas deliberadamente omitidas

- **Fecha real de finalización y duración por etapa:** la operación solo guarda `createdAt` y `updatedAt`; no existe historial de transiciones. Por eso el dashboard etiqueta las completadas como “creadas en el periodo y actualmente completadas”.
- **Embudo y tiempos históricos:** sin historial no es posible reconstruir cuántas operaciones pasaron por cada etapa ni cuánto permanecieron en ella.
- **Cumplimiento de SLA y pendiente vencido:** existe el criterio operativo de 48 horas sin actualizar para operaciones detenidas, pero no hay SLA configurable ni fecha de entrada por cada cola.
- **Margen neto, margen de oficina y rentabilidad total:** el sistema registra comisiones de socios, pero no todos los costos ni un importe materializado de comisión de oficina. Se muestran únicamente comisiones registradas.
- **Liquidez libre consolidada:** el saldo bancario actual y los compromisos de retornos provienen de modelos distintos y todavía no existe una agregación que descuente parcialidades sin riesgo de doble conteo.
- **Entradas esperadas y tendencia histórica validada:** no existe una proyección registrada ni una serie agregada por fecha de validación expuesta por el backend.

Estas métricas deben incorporarse cuando el backend registre un historial de estados y exponga agregaciones monetarias con fechas contables explícitas.
