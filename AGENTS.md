# CLAUDE.md · Sistema de operaciones (se-estatus.com)

Este archivo le da a Claude Code el contexto fijo del proyecto. Léelo completo antes de cada tarea.
Si algo de este archivo choca con lo que pide una tarea, pregunta antes de actuar.

---

## 1. Qué es el sistema

Sistema para administrar operaciones financieras entre socios comerciales, sus clientes y la oficina.
El flujo del dinero es:

1. Un **Socio Comercial** crea una operación para un cliente y registra los **pagos de ingreso** (efectivo, cheque, transferencia o depósito).
2. La **Jefa de Cajas** valida lo que entra en efectivo o cheque; la **Jefa de Cuentas** valida lo que entra a cuentas bancarias.
3. El Socio **solicita el retorno** al cliente (neto de comisiones), dividido en uno o varios pagos.
4. La **Jefa de Cuentas** paga los retornos por transferencia; la **Jefa de Cajas** entrega los de efectivo y retiro sin tarjeta.
5. El **Gerente** paga las comisiones de los socios cada sábado por transferencia.
6. El **Gerente** y el **Director** supervisan todo.

---

## 2. Stack y comandos

> TODO: completar con lo que documente `docs/MAPA_DEL_CODIGO.md`.

- Frontend: `<framework>` · carpeta `<ruta>`
- Backend: `<framework>` · carpeta `<ruta>`
- Base de datos: `<motor>`
- Correr en local: `<comando>`
- Pruebas: `<comando>`
- Migraciones: `<comando>`
- Lint / formato: `<comando>`

---

## 3. Fuente de diseño

- Archivo de Figma: https://www.figma.com/design/Fv3iaaYtIn8vvW8qusbI3P
- Páginas: `Componentes`, `Pantallas compartidas`, `Socio Comercial`, `Jefa de Cuentas`, `Jefa de Cajas`, `Gerente`, `Director`.
- Cada pantalla se implementa desde **su frame** (el link del frame viene en la tarea). Usa el MCP de Figma para leerlo.
- Prefijos de frames: `S` Socio (escritorio), `M` Socio (móvil), `0x` Jefa de Cuentas, `C` Jefa de Cajas, `G` Gerente, `D` Director.
- La página `Pantallas compartidas` explica qué pantallas son una sola base con diferencias por rol. **Nunca dupliques una pantalla por rol**: es un solo componente con permisos.
- El plan completo está en `docs/PLAN_REDISENO.md`.

---

## 4. Cómo trabajar

1. **Primero el plan, después el código.** Antes de escribir, muestra: archivos que tocarás, componentes base que usarás, endpoints, cambios de base de datos y pruebas. Espera aprobación.
2. **Una tarea = una pantalla o una pieza.** No cambies archivos que no tengan que ver con la tarea.
3. **Reutiliza** los componentes de `<ruta>/components/ui`. Si falta uno, propónlo como tarea aparte.
4. **Pruebas obligatorias** en todo lo que toque dinero, permisos o contadores.
5. Al terminar, resume qué cambió y cómo probarlo, y compáralo con el frame de Figma.

---

## 5. Roles y permisos

El backend valida los permisos en cada petición. El frontend solo muestra u oculta botones según esos mismos permisos.

| Acción | Socio | J. Cajas | J. Cuentas | Gerente | Director |
| --- | --- | --- | --- | --- | --- |
| Crear operación | Sí | — | — | — | — |
| Registrar pagos de ingreso faltantes | Sí | — | — | — | — |
| Solicitar retorno | Sí | — | — | — | — |
| Confirmar que el cliente recibió efectivo | Sí | — | — | — | — |
| Validar pagos en efectivo y cheque | — | Sí | — | — | — |
| Abrir / cerrar caja, entregar efectivo | — | Sí | — | — | — |
| Enviar efectivo de Caja a una cuenta | — | Sí | — | — | — |
| Confirmar retiros de cuentas a Caja | — | Sí | — | — | — |
| Validar pagos bancarios | — | — | Sí | — | — |
| Pagar retornos por transferencia | — | — | Sí | — | — |
| Retirar a Caja General, transferir entre cuentas | — | — | Sí | — | — |
| Confirmar envíos de Caja a cuentas | — | — | Sí | — | — |
| Pagar comisiones | — | — | — | Sí | — |
| Eliminar operación (solo pendiente de validación) | — | — | — | Sí | — |
| Catálogos (clientes, socios N2/N3, cuentas) | Su red | — | Cuentas | Sí | Consulta |
| Usuarios | — | — | — | Editar, desactivar | Crear, editar, desactivar, eliminar |
| Configuración | — | — | — | Sí | Sí |
| Reportes y bitácora | — | — | — | — | Sí |

- La Auxiliar de Cuentas comparte pendientes y pantallas con la Jefa de Cuentas (confirmar permisos exactos).
- **Modo consulta**: misma pantalla, sin botones de acción, con la etiqueta "Solo consulta" junto al título y textos neutros (nunca "tu confirmación", "ciérrala").
- Los socios de **nivel 1** son usuarios del sistema (Administración › Usuarios). Catálogos › Socios comerciales muestra solo **nivel 2 y 3**.

---

## 6. Menús por rol

- **Socio:** Mis pendientes · Operaciones · Mi red ▾ (Clientes, Socios comerciales) · Mis comisiones.
- **Jefa de Cajas:** Mis pendientes · Caja ▾ (Corte, Entradas de efectivo, Salidas de efectivo, Abrir/Cerrar caja) · Operaciones.
- **Jefa de Cuentas:** Mis pendientes · Cuentas ▾ (Cuentas bancarias y saldos, Cortes y movimientos, Entradas bancarias, Salidas bancarias, Transferir entre cuentas) · Operaciones.
- **Gerente:** Inicio · Operaciones · Comisiones · Dinero ▾ (Corte general, Cuentas bancarias y saldos) · Catálogos ▾ · Administración ▾ (Usuarios, Configuración).
- **Director:** igual que Gerente + Reportes + Administración › Bitácora.

Contadores en el menú: solo donde hay trabajo (Entradas, Salidas, Comisiones del Gerente). Un grupo cerrado muestra la suma de sus hijos. No se cuenta lo mismo dos veces.

---

## 7. Reglas de negocio

### Pagos de ingreso
- Tipos: efectivo, cheque, transferencia, depósito. Comprobante obligatorio si el monto es mayor a cero.
- Se validan **en un solo paso**: decisión + comprobante de validación (+ desglose por denominación si es efectivo). El mismo panel se usa desde Entradas, Mis pendientes y el detalle de la operación.
- **Cheque**: lo valida la Jefa de Cajas e indica su destino: *cobrado en efectivo* (entra a caja con conteo) o *depositado en una cuenta* (crea un envío que la Jefa de Cuentas confirma).
- Operación con pagos faltantes = estatus "Ingreso parcial" y aparece en Mis pendientes del Socio.

### Retornos
- Se solicitan por operación y se dividen en pagos. Tipos y campos:
  - **Transferencia**: número de cuenta o tarjeta y/o CLABE (al menos uno), banco destino, titular. La paga la Jefa de Cuentas.
  - **Efectivo** y **Retiro sin tarjeta**: hasta 3 personas autorizadas (identificación oficial vigente). Las entrega la Jefa de Cajas. El retiro sin tarjeta lo registra Cuentas, entra a Caja como ingreso y se entrega como efectivo.
- Se admite carga desde Excel (.xlsx, 5 MB, 1,000 filas) y archivo de nóminas opcional.
- Los listados de retornos por pagar son **por solicitud**, no por operación.
- Tras entregar efectivo, el Socio confirma que su cliente lo recibió.

### Movimientos entre Caja y Cuentas
- **Retiro a Caja General** (Cuentas → Caja): queda en tránsito; la cuenta baja y la caja sube cuando la Jefa de Cajas confirma.
- **Envío a cuenta bancaria** (Caja → Cuentas): forma "Depósito en efectivo" (ventanilla, cajero u OXXO), referencia y desglose por denominación de lo que sale. Queda en tránsito; **la caja baja y la cuenta sube solo cuando la Jefa de Cuentas confirma**. La Jefa de Cuentas no cuenta denominaciones.
- Estos movimientos no cambian el total del dinero del negocio.

### Comisiones
- Las paga **solo el Gerente**, por transferencia, **cada sábado** (configurable), por la semana anterior (domingo a sábado).
- Cada pago es una **salida bancaria** de la cuenta origen: aparece en Cortes y movimientos, en los movimientos de esa cuenta y en el Corte general.
- Beneficiarios con $0.00 no se muestran como pendientes.

### Caja General
- Una caja por día. Apertura con conteo inicial (prellenado del último cierre) y cierre con conteo final.
- Con la caja cerrada no se registran entradas ni salidas.

### Corte general (Gerente y Director)
- Consolida efectivo (Caja General) y bancos: saldo inicial, entradas, salidas, movimientos internos, saldo final, por tipo y total; dinero en tránsito; saldos por caja y banco; libro unificado.
- Siempre debe cuadrar: inicial + entradas − salidas = final.

### Operaciones detenidas
- Sin cambios por más de N horas (configuración, por defecto 48). Mostrar el motivo.

### Configuración (tabla única, nunca valores fijos en el código)
- Comisión de oficina (%), umbral de concentración por socio (%), horas para detenida, día de pago de comisiones, alertas activas.

### Bitácora
- Registra quién, qué, cuándo, sobre qué registro, valor antes y después.
- Obligatoria en: validaciones, rechazos, pagos, retornos, envíos, retiros, ediciones, eliminaciones, cambios de usuarios y de configuración.
- No se edita ni se borra.

### Mis pendientes
- Socio: acordeón (una sección abierta a la vez) con listas de trabajo: pagos por registrar, retornos por solicitar / en seguimiento, comprobantes rechazados, retornos por confirmar.
- Jefas: resumen con una tarjeta por tipo (cantidad, monto, el más antiguo, botón "Ir a…"). El trabajo se hace en Entradas/Salidas o en el detalle.
- Los pendientes **no se filtran por fecha**.

---

## 8. Reglas de interfaz

- **Colores con significado**: verde = entrada / validado / abrir; rojo = salida / cerrar / error; ámbar = en tránsito / pendiente; azul = activo / selección; morado = por solicitar.
- Íconos de menú: ↓ verde para entradas, ↑ rojo para salidas.
- **Formatos**: fecha "2 oct 2026" y "2 oct 2026, 18:55"; montos "$1,234.50" y negativos "−$1,234.50"; porcentajes "1.5%" (punto decimal); cuentas enmascaradas "BANORTE ••8998" (la CLABE completa solo en paneles de pago, con botón Copiar).
- Todas las fechas y horas se muestran en America/Mexico_City (hora de la oficina). El 'día' de caja y cortes va de 00:00 a 23:59 en esa zona.
- Nunca mostrar fechas ISO ni nombres internos (`updatedAt`, `CONFIRMAR_COBRO_EFECTIVO`).
- **Tablas**: máximo 7 columnas, sin scroll horizontal, estatus y acción a la derecha, estado vacío con mensaje.
- **Filtros**: solo el buscador visible; el resto detrás del botón "Filtros"; filtros activos como etiquetas con ×. Los valores por defecto nunca esconden pendientes.
- **Pestañas de método**: solo se muestran con 2 o más métodos.
- **Selector de periodo único**: un calendario para día o rango, atajos, sin fechas futuras. Es el mismo en todo el sistema.
- **Acciones en listas**: "Ver operación" (lleva al detalle) + la acción principal que abre un panel lateral.
- **Paneles laterales** para confirmar, pagar, solicitar y registrar: encabezado, cuerpo con scroll, botones fijos abajo.
- Acciones irreversibles (eliminar) piden confirmación escribiendo una palabra.
- Encabezados ligeros: solo el título, sin descripciones repetidas.
- **Móvil (Socio)**: navegación inferior de 4 pestañas, tablas como tarjetas, botón flotante para crear, subida de comprobantes con cámara.

---

## 9. Lo que NO debes hacer

**Nunca arranques el backend (`mvn spring-boot:run`, el JAR o Docker) con los perfiles default, dev o prod: todos apuntan al servidor real 72.18.198.109. Hasta que exista un perfil `local` con MySQL en localhost, solo se permite `mvn test` (usa H2 en memoria).**

- Tocar la base de datos o el servidor de producción.
- Borrar o reescribir migraciones existentes.
- Cambiar cálculos de dinero sin pruebas que los cubran.
- Copiar una pantalla para otro rol en lugar de usar permisos.
- Poner reglas de negocio (porcentajes, horas, días) fijas en el código.
- Instalar dependencias nuevas sin explicarlo en el plan.
- Hacer commits o push sin que lo pida la tarea.

---

## 10. Glosario

- **Operación**: registro de un cliente con su monto, pagos de ingreso, comisiones y retornos.
- **Pago de ingreso**: dinero que el cliente entrega a la oficina para una operación.
- **Retorno**: dinero que se devuelve al cliente (neto de comisiones).
- **Solicitud de retorno**: cada pago en que el Socio divide un retorno.
- **Red comercial**: socios de nivel 1 (usuario), 2 y 3 que cobran comisión en una operación.
- **En tránsito**: dinero que salió de un lado y aún no se confirma en el otro.
- **Corte**: resumen del dinero en un periodo.
