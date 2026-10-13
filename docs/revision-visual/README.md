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
