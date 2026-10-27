Plan de implementación del rediseño · Sistema de operaciones
8 oct 2026 · @Daniel Rubén Medina Poot
Resumen
La implementación se hace en 6 fases: primero las bases (componentes, permisos, bitácora y reglas), después la lógica de negocio nueva y al final las pantallas rol por rol, cada una probada con su usuaria antes de liberarla.
El orden importa: las pantallas de los 5 roles comparten piezas (menú, tablas, pestañas, paneles, selector de periodo) y reglas (permisos, modo consulta). Si esas piezas se construyen primero, cada pantalla nueva se arma en horas y no en días, y todas se ven y se comportan igual.
Reglas de oro para todo el proyecto
• Una tarea pequeña a la vez. Cada tarea = una rama, un pull request y una pantalla o pieza. Nunca "implementa todo el rol" en un solo pedido a la IA.
• Figma es la referencia, no el código. El agente lee el frame de Figma, pero tú decides si el resultado es correcto comparándolo con el diseño.
• El backend manda en los permisos y los cálculos. El frontend solo oculta botones; el servidor es el que bloquea acciones y calcula saldos, totales y contadores.
• Nada toca producción sin pasar por pruebas. Base de datos de pruebas con copia de datos reales, revisión de cada cambio y liberación por rol.
• Todo cambio de dinero queda en la bitácora. Validaciones, pagos, retornos, envíos y cambios de configuración.
Fase
Qué se hace
Resultado
0
Preparar repo, herramientas y entorno de pruebas
Claude Code o Codex conectado al código y a Figma
1
Componentes base del frontend
Librería de piezas reutilizables
2
Bases del backend
Permisos, configuración, bitácora, alertas y errores corregidos
3
Lógica de negocio nueva
Envíos, cheques, retornos, comisiones, corte general, pendientes, reportes
4
Pantallas por rol
Jefa de Cajas, Jefa de Cuentas, Socio, Gerente y Director
5
Versión móvil del Socio
Pantallas responsivas
6
Pruebas y salida a producción
Liberación gradual por rol
Fase 0 · Preparación (1–2 días)
Antes de pedirle una sola pantalla a la IA, deja listo el terreno. Esto evita el 80% de los problemas.
1. Respaldo y control de versiones. Asegúrate de que todo el sistema esté en Git (GitHub o similar) y crea una rama rediseno desde la principal. Cada tarea saldrá de esa rama.
2. Entorno de pruebas (staging). Una copia del sistema con su propia base de datos, cargada con una copia de los datos reales. Ahí se prueba todo; producción no se toca hasta la Fase 6.
3. Instala en VS Code:
    1. Claude Code (extensión de VS Code o terminal) o Codex. Usa uno como principal; puedes pedirle al otro una segunda revisión.
    2. El servidor MCP de Figma, conectado a Claude Code. Así el agente puede leer cada frame del archivo de Figma (medidas, textos, colores) a partir de su link.
4. Pídele al agente que haga un mapa del código. Primer pedido: "Analiza este repositorio y documenta: stack de frontend y backend, estructura de carpetas, cómo se definen rutas, modelos, permisos por rol y estilos. No cambies nada." Guarda la respuesta.
5. Crea el archivo de reglas del proyecto en la raíz: CLAUDE.md (Claude Code) o AGENTS.md (Codex). El agente lo lee en cada tarea. Debe incluir:
    ◦ El stack y cómo correr el proyecto, las pruebas y las migraciones.
    ◦ El link del archivo de Figma y la regla: "cada pantalla se implementa desde su frame de Figma y usa los componentes base de /components/ui".
    ◦ Las reglas de diseño: colores por significado (verde entrada, rojo salida, ámbar tránsito, azul activo), formato de fechas ("2 oct 2026, 18:55"), montos ("$1,234.50"), cuentas enmascaradas ("BANORTE ••8998").
    ◦ Las reglas de negocio: permisos por rol, modo consulta, todo cambio de dinero pasa por la bitácora.
    ◦ Lo que NO debe hacer: tocar producción, borrar migraciones, cambiar cálculos de dinero sin pruebas.
6. Define cómo vas a revisar. Cada tarea termina en un pull request que tú revisas: lees el resumen, pruebas la pantalla en staging y la comparas con su frame de Figma.
Fase 1 · Fundaciones del frontend (1–2 semanas)
Se construye una librería de piezas reutilizables, una por una, cada una desde su componente en la página Componentes de Figma. Ninguna pantalla se toca todavía.
1. Tokens de diseño: colores, tipografía, espaciados, bordes y sombras en un solo archivo, con los significados de color como nombres (entrada, salida, transito, activo).
2. Utilidades de formato: fechas, montos, porcentajes y cuentas enmascaradas. Una sola función para cada una, usada en todo el sistema.
3. Componentes base, en este orden:
Componente
Dónde se usa
Detalle clave
Menú lateral por rol
Todas las pantallas
Grupos desplegables, contadores, ícono verde/rojo para entradas y salidas
Barra superior
Todas
Nombre y rol correctos, campana con alertas
Encabezado de página
Todas
Título, etiqueta "Solo consulta", acciones a la derecha
Selector de periodo
Inicio, cortes, comisiones, bitácora
Un solo calendario: día o rango, atajos, sin fechas futuras
Tabla de datos
Todas las listas
Máximo 7 columnas, estado vacío, paginación, filas clicables
Barra de filtros
Listas
Buscador visible, "Filtros" en botón, filtros activos como etiquetas
Pestañas de método
Entradas, salidas, detalle
Se ocultan solas si hay un solo método
Acordeón de pendientes
Mis pendientes del Socio
Una sección abierta a la vez
Tarjeta de resumen
Mis pendientes de jefas, Inicio
Cantidad, monto, el más antiguo, botón "Ir a…"
Etiqueta de estatus
Todas
Un color por estatus, igual en todo el sistema
Panel lateral
Confirmar, pagar, solicitar, registrar
Encabezado, cuerpo con scroll, botones fijos abajo
Modal de confirmación
Eliminar, acciones irreversibles
Opción de escribir una palabra para confirmar
Campo de monto
Formularios
Formato automático, botón "Pagar todo" o "Registrar todo"
Conteo de denominaciones
Abrir y cerrar caja, validar efectivo, envíos
Billetes y monedas, total y aviso "cuadra"
Zona de archivo
Comprobantes
Arrastrar o elegir, archivo adjunto con nombre y peso
Encabezado de operación
Detalle de operación
Fondo oscuro, 4 montos, red de socios
4. Página de muestra (opcional pero muy útil): una ruta interna, por ejemplo /ui, donde se ven todos los componentes juntos. Sirve para revisarlos contra Figma de un vistazo.
Fase 2 · Fundaciones del backend (1–2 semanas)
Las decisiones cerradas y el orden de implementación para permisos y envíos de Caja a Cuentas están en [PLAN_FASE2_PERMISOS_Y_ENVIOS.md](PLAN_FASE2_PERMISOS_Y_ENVIOS.md).
Estas piezas las usan casi todas las pantallas, por eso van antes que la lógica nueva.
1. Permisos por rol y acción. Una tabla central que diga qué puede hacer cada rol (ver, crear, editar, validar, pagar, eliminar) sobre cada cosa. El backend la revisa en cada petición; el frontend la usa solo para mostrar u ocultar botones. El "modo consulta" del Gerente y el Director sale de aquí, no de pantallas copiadas.
Acción
Socio
J. Cajas
J. Cuentas
Gerente
Director
Crear operación, solicitar retorno, registrar pago
Sí
—
—
—
—
Validar pagos en efectivo y cheque
—
Sí
—
—
—
Validar pagos bancarios, pagar retornos bancarios
—
—
Sí
—
—
Entregar efectivo, abrir y cerrar caja
—
Sí
—
—
—
Pagar comisiones
—
—
—
Sí
—
Eliminar operación
—
—
—
Sí
—
Usuarios: crear, editar, eliminar
—
—
—
Editar
Todo
Configuración, reportes, bitácora
—
—
—
Configuración
Todo
2. Configuración del negocio. Una tabla con: comisión de oficina, umbral de concentración (40%), horas para operación detenida (48), día de pago de comisiones (sábado) y alertas activas. Todo el sistema lee de ahí en lugar de tener números fijos en el código.
3. Bitácora. Una tabla que registra quién, qué, cuándo, sobre qué registro, y el valor de antes y después. Se escribe desde el backend en cada acción de dinero, usuarios y configuración. No se puede editar ni borrar.
4. Alertas. Una tabla de notificaciones por usuario y un proceso que revise las reglas (concentración, saldo negativo, detenidas, eliminaciones) según la configuración.
5. Contadores de pendientes. Un solo endpoint por rol que devuelva los números del menú y de Mis pendientes, sin filtro de fechas. Así los contadores siempre coinciden con las listas.
6. Formato y zona horaria. Todas las fechas se guardan en UTC y se muestran en la zona de México, para corregir el desfase de un día que hoy aparece en algunas operaciones.
7. Corregir los errores actuales antes de construir encima de ellos (ver la sección Errores del sistema actual).
Fase 3 · Lógica de negocio nueva (2–3 semanas)
Cada punto es un conjunto de cambios en base de datos, endpoints y pruebas. Implementa uno a la vez, con pruebas automáticas de los cálculos de dinero antes de pasar al siguiente.
#
Cambio
Qué implica en el backend
1
Validación de pagos de ingreso en un solo paso
Un endpoint que reciba la decisión, el comprobante de validación y, si es efectivo, el desglose por denominación. Sirve igual desde Entradas, Mis pendientes y el detalle de la operación.
2
Cheques como pagos de ingreso
Al validar un cheque, la Jefa de Cajas elige: cobrado en efectivo (entra a caja con conteo) o depositado en una cuenta (crea un envío por confirmar para Cuentas). Se elimina la pantalla propia de cheques.
3
Envíos de Caja a cuentas bancarias
Nueva entidad con estado en tránsito → confirmado / rechazado, forma de depósito (ventanilla, cajero, OXXO), referencia y desglose de lo que sale. La caja y la cuenta cambian de saldo solo al confirmar la Jefa de Cuentas.
4
Retornos por solicitud
Listados por solicitud (no por operación) para Cuentas y Caja, con registro del pago desde la lista. Tipos de retorno con sus campos: transferencia (cuenta o CLABE, banco, titular) y efectivo / retiro sin tarjeta (hasta 3 autorizados).
5
Confirmación del Socio
Cuando Caja entrega efectivo, el Socio confirma que su cliente lo recibió; mientras tanto la entrega queda "esperando confirmación del socio".
6
Pago de comisiones como salida bancaria
Al pagar, el Gerente elige cuenta origen y sube comprobante; se registra un movimiento de salida en esa cuenta que aparece en cortes, movimientos y en el Corte general.
7
Corte general
Un endpoint que consolide efectivo y bancos por periodo: saldos inicial y final, entradas, salidas, movimientos internos, dinero en tránsito, saldos por caja y banco y libro unificado.
8
Operaciones detenidas
Cálculo con las horas de la configuración y el motivo de cada una (sin validar, retorno incompleto, sin solicitud).
9
Inicio ejecutivo
Indicadores con variación contra el periodo anterior, ingreso de oficina, concentración por socio (operaciones únicas, no niveles) y saldos por banco.
10
Reportes
Generación de PDF y Excel para los 5 reportes, con registro de descargas.
11
Usuarios
Crear usuario y eliminar definitivamente (solo Director), conservando su historial en la bitácora.
Para cada cambio, pide al agente primero el diseño técnico (tablas, endpoints, reglas) y revísalo antes de que escriba código.
Fase 4 · Pantallas por rol (4–6 semanas)
El orden sigue el camino del dinero: primero las pantallas compartidas, luego quien valida y paga (Cajas y Cuentas), después quien origina (Socio) y al final quien supervisa (Gerente y Director). Marca cada casilla cuando la pantalla esté aprobada en staging.
1. Pantallas compartidas (base para todos)
[ ] Operaciones: lista con vistas y filtros
[ ] Detalle de operación: encabezado, red de socios, pestañas Ingresos y Retornos
[ ] Panel de validación de pago (efectivo, cheque y transferencia)
[ ] Clientes y Socios comerciales (nivel 2 y 3)
2. Jefa de Cajas (página Jefa de Cajas en Figma)
[ ] Menú con Caja y contadores (C · componentes)
[ ] C0 · Mis pendientes (resumen)
[ ] C1 · Corte de caja
[ ] C2, C2a, C2a2, C2b, C2c · Entradas de efectivo: pagos de ingreso, panel de validación, cheque, retiros
[ ] C3, C3a, C3b · Salidas de efectivo: retornos y envíos a cuentas
[ ] C4 · Cerrar caja y C5 · Abrir caja
[ ] C8, C8b, C8c · Operaciones y detalle
3. Jefa de Cuentas (página Jefa de Cuentas)
[ ] 06 · Mis pendientes (resumen)
[ ] 01, 01b · Cuentas bancarias y saldos, movimientos de la cuenta
[ ] 03, 03b · Cortes y movimientos, selector de periodo abierto
[ ] 04c, 04d, 04g · Entradas bancarias: pagos de ingreso, panel, envíos de Caja
[ ] 04a, 04b, 04e · Salidas bancarias: retornos, retiros a caja, panel de registrar retorno
[ ] 05 · Transferir entre cuentas
[ ] 07, 08, 08b, 08c · Operaciones y detalle
4. Socio Comercial (página Socio Comercial, escritorio)
[ ] S1, S1a, S1b · Mis pendientes: pagos por registrar y retornos
[ ] S1c · Panel Solicitar retorno · S1d · Panel Registrar pago
[ ] S2 · Operaciones · S3, S3b, S3c, S3d · Detalle de operación
[ ] S5 · Nueva operación
[ ] S6, S7 · Mi red: clientes y socios
[ ] S8, S8b · Mis comisiones
5. Gerente (página Gerente)
[ ] G1 · Inicio
[ ] G2, G2b · Operaciones (detenidas) y detalle con eliminar
[ ] G3, G3b · Comisiones y panel de pago
[ ] G11 · Corte general · G7 · Cuentas bancarias y saldos
[ ] G9, G10 · Catálogos
[ ] G4 · Usuarios · G5 · Configuración
6. Director (página Director)
[ ] D1, D1b · Inicio ejecutivo y panel de alertas
[ ] D2, D2b, D3 · Operaciones y Comisiones en consulta
[ ] D13 · Corte general · D5 · Cuentas bancarias y saldos
[ ] D7, D8 · Catálogos en consulta
[ ] D9 · Reportes
[ ] D10, D10b · Usuarios y confirmación de eliminación
[ ] D11 · Configuración · D12 · Bitácora
Fase 5 · Versión móvil del Socio (1–2 semanas)
No son pantallas nuevas: son las mismas del Socio adaptadas a pantallas menores de 768 px con los mismos componentes. Por eso va después de que el escritorio esté aprobado.
[ ] Navegación inferior de 4 pestañas (reemplaza el menú lateral en móvil)
[ ] Tablas que se convierten en tarjetas
[ ] M1, M1b · Mis pendientes
[ ] M2 · Operaciones con botón flotante · M3 a M3d · Detalle de operación
[ ] M5 · Nueva operación con resumen fijo abajo
[ ] M6, M7 · Mi red · M8 · Mis comisiones
Prueba en celulares reales (iPhone y Android), no solo achicando el navegador: la subida de comprobantes debe permitir tomar la foto con la cámara.
Fase 6 · Pruebas y salida a producción (1–2 semanas)
1. Pruebas automáticas que el agente debe escribir junto con cada cambio:
    ◦ De cálculos de dinero: saldos, cortes, comisiones, totales del corte general. Un corte debe cuadrar siempre (inicial + entradas − salidas = final).
    ◦ De permisos: cada rol intenta una acción que no le toca y el servidor la rechaza.
    ◦ De flujos completos (con Playwright o similar): crear operación → registrar pago → validar → solicitar retorno → pagar o entregar → confirmar.
2. Prueba de cuadre con datos reales: en staging, compara el corte del sistema nuevo contra el actual para los mismos días. Deben dar lo mismo.
3. Prueba con cada usuaria (1 sesión por rol): dale tareas reales ("valida este pago", "registra este envío") y observa sin ayudar. Anota dónde duda.
4. Salida gradual por rol, con la opción de volver a la versión anterior (interruptor por rol o feature flag):
    1. Jefa de Cajas y Jefa de Cuentas (las más usadas y con dinero).
    2. Socios comerciales.
    3. Gerente y Director.
5. Una semana de acompañamiento por rol después de liberar, revisando la bitácora y las alertas diariamente.
Cómo trabajar cada tarea con Claude Code o Codex
Repite este ciclo para cada pantalla o pieza. Una tarea bien hecha toma de 1 a 3 horas.
1. Nueva rama desde rediseno: git checkout -b cajas/entradas-efectivo.
2. Pide un plan, no código. En Claude Code usa el modo plan (Plan mode); en Codex pide "solo el plan".
3. Revisa el plan: qué archivos toca, qué componentes base usa, qué endpoints necesita, qué pruebas agregará. Corrige lo que no te guste.
4. Aprueba y deja que implemente.
5. Pruébalo en staging y compáralo lado a lado con el frame de Figma.
6. Pide correcciones concretas ("el contador debe ser ámbar, no azul") en lugar de "no se parece".
7. Pull request y merge a rediseno cuando esté aprobado.
Prompt para una pantalla
Implementa la pantalla "C2 · Entradas de efectivo · Pagos de ingreso de operaciones"
del rol Jefa de Cajas. Frame de Figma: <link del frame>.

Reglas:
- Usa solo los componentes de /components/ui (tabla, pestañas de método, panel lateral).
- Respeta CLAUDE.md: formatos, colores por significado y permisos.
- Los datos vienen de GET /api/cajas/entradas/pagos-ingreso (créalo si no existe).
- El botón "Confirmar" abre el panel de validación ya existente.
- Agrega pruebas del endpoint y de permisos (solo Jefa de Cajas).

Primero muéstrame el plan. No escribas código hasta que lo apruebe.
Prompt para lógica de negocio
Necesito implementar los envíos de efectivo de Caja General a cuentas bancarias.
Reglas de negocio:
- La Jefa de Cajas registra el envío con cuenta destino, forma (ventanilla,
  cajero u OXXO), monto, referencia y desglose por denominación.
- Queda en tránsito. No cambia saldos.
- La Jefa de Cuentas lo confirma o rechaza. Al confirmar: baja Caja General
  y sube la cuenta destino, en una sola transacción.
- Todo queda en la bitácora.

Propón primero el diseño: tablas, migración, endpoints, permisos y pruebas.
Prompt de revisión (con el otro agente o en una sesión nueva)
Revisa el pull request de la rama cajas/entradas-efectivo como un revisor exigente:
errores de cálculo de dinero, permisos que falten, casos sin manejar (montos en cero,
doble clic, sesión expirada) y diferencias con el frame de Figma <link>.
Consejos
• Pega siempre el link del frame, no el del archivo completo: el agente lee solo esa pantalla.
• Si la conversación con el agente se hace larga o confusa, abre una sesión nueva; el archivo CLAUDE.md le da el contexto otra vez.
• No aceptes cambios en archivos que no tienen que ver con la tarea.
• Nunca le des acceso a la base de datos de producción.
Errores del sistema actual a corregir
Encontrados en los recorridos de cada rol. Corrígelos en la Fase 2, antes de construir pantallas encima; varios afectan cifras de dinero.
Prioridad
Error
Dónde
Alta
La lista de Operaciones da error 403 y muestra "no hay operaciones" porque envía filtros ocultos de la cola de la Jefa de Cajas
Director
Alta
Un cheque sigue "Pendiente" aunque su historial dice que ya se cobró y la operación marca 100% validada
Op. #40, todos los roles
Alta
El saldo disponible de Caja General marca $0.00 con una caja abierta de $42,718.50
Gerente, Director
Alta
El ranking y el volumen por socio cuentan cada nivel de socio como una operación aparte
Inicio Gerente y Director
Media
El encabezado muestra "Gerente" en una cuenta con rol Director
Director
Media
Mi red de socios comerciales sale vacía aunque hay socios
Director
Media
"Rango personalizado" muestra un error apenas se selecciona
Dashboards
Media
Fechas con un día de diferencia por zona horaria
Op. #40
Media
Pagos ya validados siguen con la alerta "+48h"
Detalle de operación
Media
Beneficiarios con $0.00 aparecen como "No pagado"
Comisiones
Media
"Creadas y completadas" marca 0 con operaciones finalizadas
Inicio
Baja
Filtros por defecto ("Este mes", semana pasada) que esconden pendientes
Varias listas
Baja
Textos copiados de otros roles ("Ciérrala", "tu confirmación", "listas para registrar retorno")
Gerente, Director
Baja
Fechas en formato técnico ("2026-09-20T23:26:29") y términos internos ("updatedAt", "CONFIRMAR_COBRO_EFECTIVO")
Cheques, Inicio
Baja
Cuentas de prueba ("111111111111111111") y socios duplicados (Victor Ochoa)
Catálogos
