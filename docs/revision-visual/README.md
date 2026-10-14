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

La captura final 01b muestra movimientos reales del 12 oct 2026 mediante el selector de periodo. El frame usa datos de ejemplo del 1 oct 2026. La cuenta y los saldos locales no se sustituyeron por cifras del diseño. Los frames 07–08c usan la base de Operaciones compartida entre roles. El saldo pendiente bancario por operación del frame 08b/08c requiere una respuesta de lectura del backend.

## Socio Comercial

| Frame y estado | Figma | Local antes | Local después |
| --- | --- | --- | --- |
| S1 · Mis pendientes, pagos | [49:567](S1-mis-pendientes-figma.png) | [Antes](S1-mis-pendientes-local-antes.png) | [Estado local vacío](S1-mis-pendientes-local-despues.png) |
| S1b · Mis pendientes, seguimiento | [61:1206](S1b-pendientes-seguimiento-figma.png) | [Antes](S1b-pendientes-seguimiento-local-antes.png) | [Después](S1b-pendientes-seguimiento-local-despues.png) |
| M1 · Pendientes por solicitar, 390 px | [70:1669](M1-pendientes-por-solicitar-figma.png) | [Antes](M1-pendientes-por-solicitar-local-antes.png) | [Después](M1-pendientes-por-solicitar-local-despues.png) |
| M1b · Pendientes seguimiento, 390 px | [70:1819](M1b-pendientes-seguimiento-figma.png) | [Antes](M1b-pendientes-seguimiento-local-antes.png) | [Después](M1b-pendientes-seguimiento-local-despues.png) |
| S6 · Clientes | [73:1992](S6-clientes-figma.png) | [Antes](S6-clientes-local-antes.png) | [Después](S6-clientes-local-despues.png) |
| M6 · Clientes, 390 px | [75:2244](M6-clientes-figma.png) | [Antes](M6-clientes-local-antes.png) | [Después](M6-clientes-local-despues.png) |
| S7 · Socios comerciales | [73:2173](S7-socios-figma.png) | [Antes](S7-socios-local-antes.png) | [Después](S7-socios-local-despues.png) |
| M7 · Socios comerciales, 390 px | [75:2386](M7-socios-figma.png) | [Antes](M7-socios-local-antes.png) | [Después](M7-socios-local-despues.png) |
| S8 · Mis comisiones con datos | [74:2134](S8-comisiones-figma.png) | [Sin datos locales](S8-comisiones-local-antes.png) | [Estado local vacío](S8-comisiones-local-despues.png) |
| S8b · Mis comisiones vacías | [74:2287](S8b-comisiones-vacias-figma.png) | [Antes](S8b-comisiones-vacias-local-antes.png) | [Después](S8b-comisiones-vacias-local-despues.png) |
| M8 · Mis comisiones, 390 px | [75:2530](M8-comisiones-figma.png) | [Sin datos locales](M8-comisiones-local-antes.png) | [Estado local vacío](M8-comisiones-local-despues.png) |
| S1a · Retornos por solicitar | [155:2321](S1a-retornos-por-solicitar-figma.png) | [Antes](S1a-retornos-por-solicitar-local-antes.png) | [Después](S1a-retornos-por-solicitar-local-despues.png) |
| S1c · Solicitar retorno, panel | [154:2338](S1c-solicitar-retorno-panel-figma.png) | [Antes](S1c-solicitar-retorno-panel-local-antes.png) | [Después](S1c-solicitar-retorno-panel-local-despues.png) |
| S1d · Registrar pago, panel | [156:2376](S1d-registrar-pago-panel-figma.png) | [Antes](S1d-registrar-pago-panel-local-antes.png) | [Después](S1d-registrar-pago-panel-local-despues.png) |
| S2 · Operaciones | [49:692](S2-operaciones-figma.png) | [Antes](S2-operaciones-local-antes.png) | [Después](S2-operaciones-local-despues.png) |
| M2 · Operaciones, 390 px | [71:1812](M2-operaciones-figma.png) | [Antes](M2-operaciones-local-antes.png) | [Después](M2-operaciones-local-despues.png) |
| S3 · Detalle de ingresos | [50:694](S3-detalle-ingresos-figma.png) | [Antes](S3-detalle-ingresos-local-antes.png) | [Después](S3-detalle-ingresos-local-despues.png) |
| M3 · Detalle de ingresos, 390 px | [71:1939](M3-detalle-ingresos-figma.png) | [Antes](M3-detalle-ingresos-local-antes.png) | [Después](M3-detalle-ingresos-local-despues.png) |
| S3b · Detalle de retornos | [50:902](S3b-detalle-retornos-figma.png) | [Antes](S3b-detalle-retornos-local-antes.png) | [Después](S3b-detalle-retornos-local-despues.png) |
| M3b · Detalle de retornos, 390 px | [71:2116](M3b-detalle-retornos-figma.png) | [Antes](M3b-detalle-retornos-local-antes.png) | [Después](M3b-detalle-retornos-local-despues.png) |
| S3c · Retorno por solicitar | [61:1434](S3c-retornos-por-solicitar-figma.png) | [Antes](S3c-retornos-por-solicitar-local-antes.png) | [Después](S3c-retornos-por-solicitar-local-despues.png) |
| M3c · Retorno por solicitar, 390 px | [72:1920](M3c-retorno-por-solicitar-figma.png) | [Antes](M3c-retorno-por-solicitar-local-antes.png) | [Después](M3c-retorno-por-solicitar-local-despues.png) |
| S3d · Ingreso por registrar | [62:1316](S3d-ingresos-por-registrar-figma.png) | [Antes](S3d-ingresos-por-registrar-local-antes.png) | [Después](S3d-ingresos-por-registrar-local-despues.png) |
| M3d · Ingreso por registrar, 390 px | [72:2027](M3d-ingresos-por-registrar-figma.png) | [Antes](M3d-ingresos-por-registrar-local-antes.png) | [Después](M3d-ingresos-por-registrar-local-despues.png) |
| S5 · Nueva operación | [68:1613](S5-nueva-operacion-figma.png) | [Antes](S5-nueva-operacion-local-antes.png) | [Después](S5-nueva-operacion-local-despues.png) |
| M5 · Nueva operación, 390 px | [72:2160](M5-nueva-operacion-figma.png) | [Antes](M5-nueva-operacion-local-antes.png) | [Después](M5-nueva-operacion-local-despues.png) |

El Socio local tiene una solicitud por iniciar y una en seguimiento; sus pagos de ingreso ya están completos. También carece de clientes, socios comerciales y comisiones en la semana ilustrada. Las capturas usan esos datos sin sustituir montos por los de Figma.
Las capturas S1d, S3d y M3d usan una respuesta GET simulada en Chrome sobre la operación local #42 para representar $50,000.00 por registrar; no se envían formularios ni se altera MySQL. El formulario S5/M5 no muestra el resumen de un borrador hasta tener cotización de lectura del backend.

## Pantallas compartidas · Jefa de Cajas

| Frame y estado | Figma | Local antes | Local después |
| --- | --- | --- | --- |
| C8 · Operaciones | [93:2055](C8-operaciones-figma.png) | [Antes](C8-operaciones-local-antes.png) | [Estado actual](C8-operaciones-local-despues.png) |
| C8b · Retornos en efectivo | [93:2170](C8b-detalle-retornos-figma.png) | [Antes](C8b-detalle-retornos-local-antes.png) | [Después](C8b-detalle-retornos-local-despues.png) |
| C8c · Ingresos | [111:2252](C8c-detalle-ingresos-figma.png) | [Antes](C8c-detalle-ingresos-local-antes.png) | [Después](C8c-detalle-ingresos-local-despues.png) |

La pestaña «Con entregas en efectivo» de C8 espera un filtro paginado de backend. C8b usa la operación local #40, que tiene el mismo total que el ejemplo del frame pero solicitudes en estados distintos. No se alteraron estados, importes ni acciones para fabricar la captura.

## Gerente

| Frame | Figma | Local antes | Local después |
| --- | --- | --- | --- |
| G1 · Inicio | [159:1215](G1-inicio-figma.png) | [Antes](G1-inicio-local-antes.png) | [Después](G1-inicio-local-despues.png) |
| G2 · Operaciones detenidas | [160:1275](G2-operaciones-detenidas-figma.png) | [Antes](G2-operaciones-detenidas-local-antes.png) | [Después](G2-operaciones-detenidas-local-despues.png) |
| G2b · Detalle con eliminar | [160:1464](G2b-detalle-eliminar-figma.png) | [Antes](G2b-detalle-eliminar-local-antes.png) | [Después](G2b-detalle-eliminar-local-despues.png) |
| G3 · Comisiones | [161:1397](G3-comisiones-figma.png) | [Antes](G3-comisiones-local-antes.png) | [Después](G3-comisiones-local-despues.png) |
| G3b · Pagar comisión | [161:1588](G3b-pagar-comision-figma.png) | [Antes](G3b-pagar-comision-local-antes.png) | [Después](G3b-pagar-comision-local-despues.png) |
| G4 · Usuarios | [162:1519](G4-usuarios-figma.png) | [Antes](G4-usuarios-local-antes.png) | [Después](G4-usuarios-local-despues.png) |
| G5 · Configuración | [162:1757](G5-configuracion-figma.png) | [Antes](G5-configuracion-local-antes.png) | [Después](G5-configuracion-local-despues.png) |
| G7 · Cuentas y saldos | [169:1938](G7-cuentas-saldos-figma.png) | [Antes](G7-cuentas-saldos-local-antes.png) | [Estado actual](G7-cuentas-saldos-local-despues.png) |
| G9 · Clientes | [169:2639](G9-clientes-figma.png) | [Antes](G9-clientes-local-antes.png) | [Después](G9-clientes-local-despues.png) |
| G10 · Socios comerciales | [169:2888](G10-socios-comerciales-figma.png) | [Antes](G10-socios-comerciales-local-antes.png) | [Después](G10-socios-comerciales-local-despues.png) |
| G11 · Corte general | [184:2098](G11-corte-general-figma.png) | [Antes](G11-corte-general-local-antes.png) | [Después](G11-corte-general-local-despues.png) |

Capturas locales a 1440 px con `prueba.gerente@prueba.test`; cifras y usuarios son los datos reales locales. G3/G3b seleccionan «Este mes» para mostrar la comisión pendiente local de $10.00. El frame de G11 usa otro periodo y datos de ejemplo; el corte local conserva las cifras que entrega su API.
