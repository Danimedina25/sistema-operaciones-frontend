# Progreso de la migración de Figma · `rediseno`

Archivo: `Fv3iaaYtIn8vvW8qusbI3P`. Cada etapa se marca al terminar pruebas y revisión local. El frontend y el backend tienen repositorios independientes. No se modifican permisos, entidades, tablas ni cálculos de dinero durante esta migración.

## Estado

- [x] Fase 1, tareas 1–5: piezas compartidas iniciales. La tarea 5 quedó en `02dbb2b` (`feat: selector de periodo compartido`).
- [x] 1. Panel lateral compartido y subida de comprobante. `ActionDrawer` unifica encabezado, cuerpo desplazable, pie fijo y foco; `ReceiptUploadField` unifica carga, vista previa, validación de tipo/tamaño y cámara. Se aplicó a validar ingresos y cheques, registrar/editar pagos, registrar retornos, entregar efectivo y solicitar retornos. Los dos modales de **pago de comisiones** quedaron como estaban: su prueba aislada falló dos veces por `SecurityError: localStorage is not available for opaque origins`, antes de poder comprobar el envío; no se modificó su flujo. Endpoints nuevos: ninguno. Frontend: 504 pruebas pasaron antes de la restauración de esos dos modales; backend: `mvn test -q` pasó con perfil `test` (H2); build: pasó. Revisión local con `prueba.socio`, `prueba.cajas` y `prueba.gerente` a 1440/1024 px: sin desbordamiento en `/operaciones`; panel real de pago del Socio y de cheque de Cajas de 560 px y con pie fijo. Panel del Socio a 390 px: ocupa 390 px, sin desbordamiento y con entrada de cámara. Comparación: ancho, encabezado y pie del panel siguen los frames `111:2059`, `165:2378`, `156:2476`, `154:2425` y `161:1719`; el gestor histórico de cheques conserva sus opciones propias.
- [x] 2. Operaciones y optimización de solicitudes. Detenidas busca en el servidor antes de paginar; la creación tiene pantalla propia; el detalle usa pestañas Ingresos/Retornos y tablas de seis y siete columnas que pasan a tarjetas por ancho del contenedor. Se conservaron las acciones por rol. Los catálogos se cargan al abrir formulario o filtro y el listado de notificaciones al abrir la campana; en `/operaciones` no hay intervalo ni recarga por foco. Endpoints/campos nuevos de lectura en backend: `GET /api/operations/stalled/search` y `saldoPendientePorSolicitar` en la respuesta de operación. El resumen de cifras de un borrador de operación queda oculto porque no existe una respuesta de lectura para calcularlo antes de crear; el formulario conserva la validación previa de que los comprobantes no excedan el monto para evitar creaciones parciales. Pruebas: frontend 507/507 con `--maxWorkers=4 --testTimeout=30000`, build correcto; backend H2 226/226. Con el límite anterior de 5 s, dos pasadas tuvieron tiempos de espera en pruebas de varios módulos bajo carga; esas partes quedaron intactas. Revisión local con Socio, Gerente y Cajas a 1440 y 1024 px, y Socio a 390 px: sin desbordamiento en lista, creación, detalle y retornos; operación #40 con tres retornos. La búsqueda `objetivo` produjo petición al nuevo endpoint y el listado del Socio hizo cero peticiones adicionales durante 35 s inactivo. Comparación con Figma: lista `49:692`/`160:1275`, detalle `50:694`/`50:902`, creación `68:1613` y paneles `156:2376`/`154:2338`.
- [ ] 3. Socio. Cambios y endpoints: pendiente. Revisión: pendientes, red, comisiones y navegación móvil.
- [ ] 4. Jefa de Cajas. Cambios y endpoints: pendiente. Revisión: corte, entradas, salidas, caja y contadores.
- [ ] 5. Jefa y Auxiliar de Cuentas. Cambios y endpoints: pendiente. Revisión: cuentas, movimientos, entradas y salidas.
- [ ] 6. Gerente, Director y Admin. Cambios y endpoints: pendiente. Revisión: inicio, operaciones, comisiones, dinero, catálogos, usuarios y configuración.
- [ ] 7. Revisión final. Cambios y endpoints: pendiente. Revisión: menús por rol, tres anchos, flujo completo y diferencia `main..rediseno` del backend.

## Inventario de Figma verificado con MCP

El listado general del MCP devolvió solo dos lienzos, pero los otros cinco se pudieron abrir por sus ID y sus frames respondieron. Los siete lienzos esperados son:

### Componentes (`2:2`)

`2:481` Sidebar Jefa de Cuentas · `2:482` Topbar Jefa de Cuentas · `20:1312` Sidebar Jefa de Cajas · `20:1313` Topbar Jefa de Cajas · `41:602` Tabs de método · `48:1009` Sidebar Socio · `48:1010` Topbar Socio · `69:1266` Navegación inferior móvil Socio · `158:1881` Sidebar Gerente · `158:1882` Topbar Gerente · `175:2080` Sidebar Director · `175:2081` Topbar Director.

### Pantallas compartidas (`57:1141`)

`57:1142` Diferencias por rol.

### Socio Comercial (`49:566`)

`49:567` S1 Mis pendientes · `49:692` S2 Operaciones · `50:694` S3 Detalle ingresos · `50:902` S3b Detalle retornos · `61:1206` S1b Pendientes seguimiento · `61:1434` S3c Retornos por solicitar · `62:1316` S3d Ingresos por registrar · `68:1613` S5 Nueva operación · `70:1669` M1 Pendientes por solicitar · `70:1819` M1b Pendientes seguimiento · `71:1812` M2 Operaciones · `71:1939` M3 Detalle ingresos · `71:2116` M3b Detalle retornos · `72:1920` M3c Retorno por solicitar · `72:2027` M3d Ingresos por registrar · `72:2160` M5 Nueva operación · `73:1992` S6 Clientes · `73:2173` S7 Socios comerciales · `74:2134` S8 Mis comisiones · `74:2287` S8b Mis comisiones sin datos · `75:2244` M6 Clientes · `75:2386` M7 Socios comerciales · `75:2530` M8 Mis comisiones · `154:2338` S1c Solicitar retorno, panel · `155:2321` S1a Retornos por solicitar · `156:2376` S1d Registrar pago, panel.

### Jefa de Cajas (`21:566`)

`21:567` C1 Corte · `22:654` C2b Entradas por retiros bancarios · `23:830` C4 Cerrar caja · `23:1072` C5 Abrir caja · `31:1006` C2c Entradas sin retiros · `35:1107` C3a Salidas sin retornos · `88:2020` C0 Mis pendientes · `93:2055` C8 Operaciones · `93:2170` C8b Detalle retornos en efectivo · `94:2280` C3 Salidas por retornos · `109:2010` C2 Entradas por pagos · `111:1954` C2a Validar ingreso, panel · `111:2252` C8c Detalle ingresos · `144:2551` C3b Salidas por envíos a cuentas · `165:2273` C2a2 Validar cheque, panel.

### Jefa de Cuentas (`0:1`)

`3:2` 01 Cuentas y saldos · `4:96` 01b Movimientos de cuenta · `6:401` 03 Cortes y movimientos · `7:378` 04b Retiros a caja · `7:565` 05 Transferir entre cuentas · `55:590` 06 Mis pendientes · `55:696` 07 Operaciones · `56:722` 08 Detalle ingresos · `56:890` 08b Detalle retornos · `92:830` 08c Retorno bancario por pagar · `127:828` 04a Salidas por retornos · `127:1118` 04c Entradas por pagos · `129:1019` 03b Selector de fecha abierto · `138:1123` 04d Validar ingreso, panel · `140:1192` 04e Registrar retorno, panel · `146:1333` 04g Envíos desde Caja.

### Gerente (`159:1214`)

`159:1215` G1 Inicio · `160:1275` G2 Operaciones detenidas · `160:1464` G2b Detalle con eliminar · `161:1397` G3 Comisiones · `161:1588` G3b Pagar comisión, panel · `162:1519` G4 Usuarios · `162:1757` G5 Configuración · `169:1938` G7 Cuentas y saldos · `169:2639` G9 Clientes · `169:2888` G10 Socios comerciales · `184:2098` G11 Corte general.

### Director (`177:1214`)

`177:1215` D1 Inicio · `177:2389` D2 Operaciones · `177:2517` D2b Detalle de consulta · `177:2627` D3 Comisiones de consulta · `177:2858` D5 Cuentas y saldos · `177:3222` D7 Clientes · `177:3332` D8 Socios comerciales · `178:1924` D9 Reportes · `178:2165` D12 Bitácora · `179:2079` D10 Usuarios · `179:2431` D10b Eliminar usuario · `180:2255` D11 Configuración · `180:2483` D1b Alertas abiertas · `184:2521` D13 Corte general.
