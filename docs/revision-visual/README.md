# Revisión visual contra Figma

Archivo `Fv3iaaYtIn8vvW8qusbI3P`. Las capturas locales tienen 1440 px de ancho salvo las variantes históricas indicadas. Las diferencias y su estado están en [PROGRESO_REDISENO.md](../PROGRESO_REDISENO.md#revisión-visual).

## Jefa de Cajas

| Frame y estado | Figma | Local antes | Local después |
| --- | --- | --- | --- |
| C4 · Cerrar caja | [23:830](figma-c4-cerrar-caja.png) | [Antes](C4-cerrar-caja-local-antes.png) | [Después](C4-cerrar-caja-local-despues.png) |
| C5 · Abrir caja | [23:1072](figma-c5-abrir-caja.png) | [Antes](C5-abrir-caja-local-antes.png) | [Después](C5-abrir-caja-local-despues.png) |
| C1 · Corte | [21:567](C1-corte-figma.png) | [Antes](C1-corte-local-antes.png) | [Después](C1-corte-local-despues.png) |
| C2 · Entradas, pagos | [109:2010](C2-entradas-pagos-figma.png) | [Antes](C2-entradas-pagos-local-antes.png) | [Después](C2-entradas-pagos-local-despues.png) |
| C2a · Validar efectivo | [111:1954](C2a-entradas-validar-efectivo-figma.png) | [Antes](C2a-entradas-validar-efectivo-local-antes.png) | [Después](C2a-entradas-validar-efectivo-local-despues.png) |
| C2a2 · Validar cheque | [165:2273](C2a2-entradas-validar-cheque-figma.png) | [Antes](C2a2-entradas-validar-cheque-local-antes.png) | [Estado pendiente](C2a2-entradas-validar-cheque-local-despues.png) |
| C2b · Entradas, retiros | [22:654](C2b-entradas-retiros-figma.png) | [Antes](C2b-entradas-retiros-local-antes.png) | [Después](C2b-entradas-retiros-local-despues.png) |
| C2c · Retiros vacíos | [31:1006](C2c-entradas-retiros-vacio-figma.png) | [Tras C2b](C2c-entradas-retiros-vacio-local-antes.png) | [Después](C2c-entradas-retiros-vacio-local-despues.png) |
| C3 · Salidas, retornos | [94:2280](C3-salidas-retornos-figma.png) | [Antes](C3-salidas-retornos-local-antes.png) | [Después](C3-salidas-retornos-local-despues.png) |
| C3a · Salidas vacías | [35:1107](C3a-salidas-vacio-figma.png) | [Antes](C3a-salidas-vacio-local-antes.png) | [Después](C3a-salidas-vacio-local-despues.png) |
| C3b · Envíos a cuentas | [144:2551](C3b-salidas-envios-figma.png) | [Pestaña ausente](C3b-salidas-envios-local-antes.png) | Pendiente de backend |
| C0 · Mis pendientes | [88:2020](C0-mis-pendientes-figma.png) | [Antes](C0-mis-pendientes-local-antes.png) | [Después](C0-mis-pendientes-local-despues.png) |

La captura de apertura y las capturas de estados vacíos usan respuestas de lectura simuladas en Chrome sobre la sesión de `prueba.cajas@prueba.test`; no escriben en MySQL. Las capturas del cheque muestran el mismo flujo vigente antes y después, porque su diferencia depende de permisos y escritura de backend. Las imágenes previas de Abrir/Cerrar caja en 1600, 1024 y 390 px se conservan en esta carpeta.

## Jefa de Cuentas

| Frame y estado | Figma | Local antes | Local después |
| --- | --- | --- | --- |
| 01 · Cuentas bancarias y saldos | [3:2](01-cuentas-saldos-figma.png) | [Antes](01-cuentas-saldos-local-antes.png) | [Después](01-cuentas-saldos-local-despues.png) |
| 01b · Movimientos de la cuenta | [4:96](01b-movimientos-cuenta-figma.png) | [Antes, vacío](01b-movimientos-cuenta-local-antes.png) | [Después, con datos](01b-movimientos-cuenta-local-despues.png) |
| 03 · Cortes y movimientos | [6:401](03-cortes-movimientos-figma.png) | [Antes](03-cortes-movimientos-local-antes.png) | [Después](03-cortes-movimientos-local-despues.png) |
| 03b · Selector de periodo | [129:1019](03b-selector-periodo-figma.png) | [Antes](03b-selector-periodo-local-antes.png) | [Después](03b-selector-periodo-local-despues.png) |
| 04a · Salidas bancarias | [127:828](04a-salidas-bancarias-figma.png) | [Antes](04a-salidas-bancarias-local-antes.png) | [Después](04a-salidas-bancarias-local-despues.png) |
| 04b · Retiros a Caja | [7:378](04b-retiros-caja-figma.png) | [Antes](04b-retiros-caja-local-antes.png) | [Después](04b-retiros-caja-local-despues.png) |
| 04c · Entradas bancarias | [127:1118](04c-entradas-bancarias-figma.png) | [Antes](04c-entradas-bancarias-local-antes.png) | [Después](04c-entradas-bancarias-local-despues.png) |
| 04d · Validar ingreso bancario | [138:1123](04d-validar-ingreso-bancario-figma.png) | [Antes](04d-validar-ingreso-bancario-local-antes.png) | [Después](04d-validar-ingreso-bancario-local-despues.png) |
| 04e · Registrar retorno | [140:1192](04e-registrar-retorno-figma.png) | [Antes](04e-registrar-retorno-local-antes.png) | [Después](04e-registrar-retorno-local-despues.png) |
| 04g · Envíos desde Caja | [146:1333](04g-envios-caja-figma.png) | [Pestaña ausente](04g-envios-caja-local-antes.png) | [Sigue pendiente](04g-envios-caja-local-despues.png) |
| 05 · Transferir entre cuentas | [7:565](05-transferir-cuentas-figma.png) | [Antes](05-transferir-cuentas-local-antes.png) | [Después](05-transferir-cuentas-local-despues.png) |
| 06 · Mis pendientes | [55:590](06-pendientes-cuentas-figma.png) | [Antes](06-pendientes-cuentas-local-antes.png) | [Después](06-pendientes-cuentas-local-despues.png) |
| 07 · Operaciones | [55:696](07-operaciones-figma.png) | [Antes](07-operaciones-local-antes.png) | [Estado actual](07-operaciones-local-despues.png) |
| 08 · Detalle de ingresos | [56:722](08-detalle-ingresos-figma.png) | [Antes](08-detalle-ingresos-local-antes.png) | [Estado actual](08-detalle-ingresos-local-despues.png) |
| 08b · Detalle de retornos | [56:890](08b-detalle-retornos-figma.png) | [Antes](08b-detalle-retornos-local-antes.png) | [Estado actual](08b-detalle-retornos-local-despues.png) |
| 08c · Retorno bancario por pagar | [92:830](08c-retorno-por-pagar-figma.png) | [Antes](08c-retorno-por-pagar-local-antes.png) | [Estado actual](08c-retorno-por-pagar-local-despues.png) |

La captura final 01b muestra movimientos reales del 12 oct 2026 mediante el selector de periodo. El frame usa datos de ejemplo del 1 oct 2026. La cuenta y los saldos locales no se sustituyeron por cifras del diseño. Los frames 07–08c usan la base de Operaciones compartida entre roles; sus diferencias pendientes se corregirán en la etapa «Pantallas compartidas».
