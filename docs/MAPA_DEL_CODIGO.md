# Mapa del código

Revisión estática de los dos repositorios al 8 oct 2026. Este documento describe el código actual; las reglas objetivo del rediseño se citan por separado desde [CLAUDE.md](../CLAUDE.md), especialmente su sección 5. No se ejecutaron servicios, pruebas, migraciones ni consultas a bases de datos.

## Repositorios, stack y comandos

| Parte | Ubicación y tecnología | Evidencia |
| --- | --- | --- |
| Frontend | Este repositorio: React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, Axios, Tailwind CSS 4, React Hook Form y Zod | [package.json](../package.json), [vite.config.ts](../vite.config.ts) |
| Backend | `/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones`: Java 17, Spring Boot 3.2, Maven, Spring Web, Security, Data JPA y WebSocket | `pom.xml` del backend |
| Base de datos | MySQL mediante Spring Data JPA/Hibernate; H2 está declarado para pruebas | `pom.xml` y `src/main/resources/application*.properties` del backend |
| Entrega | Frontend compilado y servido por Nginx; backend empaquetado como JAR en una imagen con Java 17 | [Dockerfile](../Dockerfile), [nginx.conf](../nginx.conf) y `Dockerfile` del backend |

**Frontend:** desde la raíz de este repositorio, `npm ci`, configurar `VITE_API_URL` con la URL base del backend y ejecutar `npm run dev`. `npm run build` ejecuta TypeScript y Vite; `npm run preview` sirve la compilación; `npm test` ejecuta Vitest una vez; `npm run lint` ejecuta ESLint. No hay script de formato. La variable es obligatoria según [env.ts](../src/shared/lib/env.ts); no se documenta aquí ningún valor privado de entorno.

**Backend:** desde su raíz, configurar MySQL y el perfil local, ejecutar `mvn spring-boot:run`; `mvn test` ejecuta las pruebas y `mvn package` empaqueta. El perfil por defecto observado es `dev`, el puerto configurado es 8080 y `spring.jpa.hibernate.ddl-auto=update` figura en `application.properties` y `application-dev.properties`. Hay que revisar la configuración efectiva antes de arrancar el servidor: con `update`, Hibernate puede modificar el esquema. No se encontró Maven Wrapper (`mvnw`) ni tarea de lint/formato del backend.

**Migraciones:** el backend tiene scripts SQL fechados en `migrations/`, incluidos los de parcialidades, Caja General, cheques, transferencias y retiros a caja. No se identificó Flyway, Liquibase ni comando de aplicación automática en `pom.xml`. Su aplicación y orden requieren el procedimiento propio de base de datos; `ddl-auto=update` no equivale a ejecutar esos scripts. No se tocaron ni ejecutaron migraciones.

## Estructura y flujo de una petición

### Frontend

| Ruta | Contenido |
| --- | --- |
| [src/main.tsx](../src/main.tsx), [src/app/providers](../src/app/providers), [src/App.tsx](../src/App.tsx) | Arranque, proveedores y montaje de la aplicación; TanStack Query gestiona caché y solicitudes. |
| [src/app/router/index.tsx](../src/app/router/index.tsx), [src/routes/paths.ts](../src/routes/paths.ts), [src/routes/guards](../src/routes/guards) | Tabla de rutas, URL públicas, autenticación y acceso por rol. |
| [src/modules](../src/modules) | Pantallas y lógica agrupadas por dominio. Cada módulo suele tener `pages/`, `components/`, `hooks/`, `api/`, `types/` y `schemas/`; algunos usan archivos `api.ts` en la raíz. |
| [src/shared/components/ui](../src/shared/components/ui), [src/shared/components/layout](../src/shared/components/layout) | Controles reutilizables, layout, encabezado y menú. |
| [src/shared/lib/axios.ts](../src/shared/lib/axios.ts), [src/shared/lib/env.ts](../src/shared/lib/env.ts) | Cliente HTTP con `VITE_API_URL`, token Bearer y manejo de 401. |
| [src/shared/constants/access-control.ts](../src/shared/constants/access-control.ts), [src/modules/auth/store/auth.context.tsx](../src/modules/auth/store/auth.context.tsx) | Acceso por ruta y estado de autenticación. |
| [src/styles/index.css](../src/styles/index.css), [src/shared/styles/ui-tokens.ts](../src/shared/styles/ui-tokens.ts) | Entrada de Tailwind y clases compartidas. |

Las pantallas registradas están principalmente en `src/modules/{dominio}/pages`: `auth`, `operations`, `clientes`, `socioscomerciales`, `users`, `bank-accounts`, `caja-general`, `corte`, `configuraciones` y `comisionessocioscomerciales`. `src/app/pages/DashboardPage.tsx` compone vistas de `gerente` y `direccion`; `cheques/ChequesPage.tsx` vive directamente en el módulo. `cash-withdrawals` y `notifications` tienen API, hooks o componentes sin página propia registrada. [PendingDeliveriesPage.tsx](../src/modules/operations/pages/PendingDeliveriesPage.tsx) existe, pero no aparece en el router revisado.

El router vuelve a usar [DailyCashCutPage.tsx](../src/modules/corte/pages/DailyCashCutPage.tsx) para `/corte`, `/corte/saldos` y `/corte/movimientos`; [OperationDetailPage.tsx](../src/modules/operations/pages/OperationDetailPage.tsx) sirve el detalle desde varias URL de operaciones y retornos. Las rutas de restablecimiento de contraseña están definidas en `paths.ts`, pero no se registran en `app/router/index.tsx`.

### Backend

La raíz de Java es `src/main/java/com/sistemadeoperaciones`. Los paquetes por dominio son `auth`, `usuarios`, `clientes`, `socioscomerciales`, `pagos`, `cheques`, `cajageneral`, `retiroscaja`, `cuentasbancarias`, `corte`, `transferencias`, `comisionessocioscomerciales`, `configuraciones` y `notifications`. Dentro de ellos están los `controller`, `service`, `repository`, `model`/`models`, `dto` y enums; `shared` reúne seguridad JWT, auditoría, excepciones y configuración transversal. Hay pruebas en `src/test/java` y configuración de pruebas en `src/test/resources`.

Los **modelos persistentes** son entidades JPA, por ejemplo `pagos/model/PaymentOperation.java`, `OperationPayment.java`, `OperationReturnPayment.java`, `OperationReturnInstallment.java`, `cajageneral/model/`, `cuentasbancarias/models/` y `usuarios/model/User.java`. Los tipos TypeScript de `src/modules/*/types` modelan respuestas y formularios del cliente; no constituyen una capa de persistencia independiente.

### Endpoints principales

Los archivos `src/modules/*/api/*.api.ts` (o `api.ts`) llaman al backend mediante [axios.ts](../src/shared/lib/axios.ts). Los controladores siguientes definen las rutas HTTP; esta tabla enumera prefijos, no todos los métodos:

| Dominio | Prefijo del backend | Código cliente |
| --- | --- | --- |
| Sesión y usuarios | `/api/auth`, `/api/admin/users` | `auth/api/auth.api.ts`, `users/api/users.api.ts` |
| Clientes y red | `/api/clientes`, `/api/commercial-partners` | `clientes/api/clientes.api.ts`, `socioscomerciales/api/socioscomerciales.api.ts` |
| Operaciones, ingresos y retornos | `/api/operations`, `/api/operations/returns` | `operations/api/operations.api.ts` |
| Cheques y Caja General | `/api/operations/cheques`, `/api/caja-general` | `cheques/api.ts`, `caja-general/api/caja-general.api.ts` |
| Bancos y corte | `/api/bank-accounts`, `/api/bank-movements`, `/api/bank-account-daily-cuts`, `/api/daily-cash-cuts`, `/api/bank-transfers`, `/api/bank-cash-withdrawals` | `bank-accounts/api`, `corte/api`, `cash-withdrawals/api.ts` |
| Comisiones, configuración y avisos | `/api/commercial-partner-commissions`, `/api/configuraciones`, `/api/notifications` | API de sus módulos homónimos |

Consultar el método y los DTO del controlador correspondiente antes de implementar un flujo: un prefijo compartido no implica los mismos permisos para lectura y escritura.

## Roles y permisos actuales

El backend almacena roles en `usuarios/model/Role.java` y `User.java` (relación `user_roles`). `JwtAuthFilter` extrae la lista del JWT y crea autoridades `ROLE_*`; `SecurityConfig` exige autenticación y activa seguridad por método, donde los controladores usan `@PreAuthorize`. Los servicios también pueden imponer alcance por propietario, estado o tipo de pago. El frontend guarda token y usuario, `hasRole` acepta cualquiera de los roles indicados, `ProtectedRoute` comprueba sesión y `RoleGuard` usa `ROUTE_ACCESS`; páginas y componentes vuelven a calcular permisos de botones. Por tanto, ver una ruta no autoriza todas sus acciones.

| Rol | Acceso y acciones observadas, ejemplos representativos |
| --- | --- |
| Socio Comercial (`SOCIO_COMERCIAL`) | Rutas de clientes, red, operaciones, retornos por solicitar/solicitados y mis comisiones. El backend admite crear operación y pago, solicitar retorno y confirmar recepción de parcialidad. |
| Jefa de Cajas (`JEFA_CAJAS`) | Mis pendientes, operaciones, cheques, Caja General y entregas de hoy. Puede abrir/cerrar caja, registrar movimientos y confirmar retiros bancarios a caja; interviene en efectivo y cheques. |
| Jefa de Cuentas (`JEFA_CUENTAS`) | Mis pendientes, operaciones, cuentas, corte/movimientos, cheques y retornos por pagar. Puede crear retiros a caja y transferencias entre cuentas; algunos endpoints bancarios de escritura son exclusivos de ella y Admin. |
| Auxiliar de Cuentas (`AUXILIAR_CUENTAS`) | Comparte varias rutas de lectura y pendientes con Jefa de Cuentas. Algunos endpoints de ingresos y retornos también le conceden escritura; transferencias entre cuentas y retiros a caja tienen `POST` reservado a Jefa/Admin. Permiso exacto por acción aún requiere conciliación. |
| Gerente (`GERENTE`) | Dashboard, pendientes del equipo, operaciones, comisiones, usuarios, configuración y vistas financieras. Hoy el backend también le permite diversas escrituras de operación, validación, retorno, catálogo y configuración; puede pagar comisiones y eliminar operaciones. |
| Director (`DIRECCION`) | Dashboard ejecutivo y múltiples rutas de consulta. Hoy varios controladores le permiten crear/editar operaciones, validar ingresos, solicitar o entregar retornos, editar catálogos/configuración y eliminar usuarios; no puede pagar comisiones ni eliminar operaciones según los controladores respectivos. |
| Administrador (`ADMIN`) | Rol transversal presente en casi todas las rutas y escrituras. Incluye, por ejemplo, eliminación de días de caja y pago de comisiones; no está definido como rol operativo en la matriz objetivo de la sección 5. |

Fuentes clave: [access-control.ts](../src/shared/constants/access-control.ts), [Sidebar.tsx](../src/shared/components/layout/Sidebar.tsx), [auth.types.ts](../src/modules/auth/types/auth.types.ts), [OperationsPage.tsx](../src/modules/operations/pages/OperationsPage.tsx), y en backend `SecurityConfig.java`, `PaymentOperationController.java`, `ReturnsOperationController.java`, `ReturnInstallmentController.java`, `CashGeneralController.java`, `BankTransferController.java` y `UserManagementController.java`.

### Diferencias frente a la sección 5 de `CLAUDE.md`

La matriz del rediseño expresa la política deseada. La tabla compara ejemplos comprobados en controladores y UI, sin asumir que una anotación por sí sola describe todas las reglas del servicio.

| Acción o área | Código actual | Política del rediseño | Trabajo a conciliar |
| --- | --- | --- | --- |
| Crear/editar operación y registrar ingresos | `PaymentOperationController` admite Admin, Gerente, Dirección y Socio; `OperationsPage` muestra creación a Socio/Admin. | Crear y completar ingresos: Socio. | Restringir backend y UI de forma consistente; revisar edición y alcance por propietario. |
| Validar/rechazar ingreso | El controlador admite Admin, Gerente, Dirección, Jefa de Cajas, Jefa de Cuentas y Auxiliar. | Efectivo/cheque: Jefa de Cajas; bancario: Jefa de Cuentas. | Separar permiso según método y comprobante; revisar la lógica de servicio además de `@PreAuthorize`. |
| Solicitar/realizar retorno | Solicitud: Admin, Gerente, Dirección, Socio. `realize` permite Admin, Gerente, Dirección, Auxiliar y ambas jefas. | Solicita Socio; transferencia paga Jefa de Cuentas; efectivo entrega Jefa de Cajas. | Ajustar por tipo de retorno; decidir el papel de Auxiliar. |
| Entregar efectivo | `ReturnInstallmentController.deliver` y `ReturnsOperationController.mark-cash-delivered` admiten Admin, Gerente, Dirección y Jefa de Cajas. | Entrega Jefa de Cajas. | Retirar escrituras de supervisión si la política sigue vigente. |
| Comisiones | Pago individual/lote: Admin y Gerente; Dirección consulta. Generación/regeneración: Admin, Gerente y Dirección. | Solo Gerente paga. | Decidir el alcance de Admin y si Dirección puede regenerar; probar salidas bancarias. |
| Eliminar operación | `DELETE /api/operations/{id}`: Admin y Gerente. | Solo Gerente, únicamente pendiente de validación. | Comprobar restricción de estado en servicio y alinear Admin/UI. |
| Catálogos y configuración | Gerente/Dirección tienen varias escrituras en clientes, socios, cuentas y configuración; Jefa de Cuentas crea cuentas pero no las edita. | Director consulta catálogos; Gerente administra; Cuentas administra cuentas. | Ajustar permisos por entidad y acción, también en formularios. |
| Usuarios | API permite crear, editar y desactivar a Admin, Gerente y Dirección; eliminar a Admin/Dirección. En frontend, el botón de creación de `UsersPage` está limitado a Admin. | Gerente edita/desactiva; Director crea/edita/desactiva/elimina. | Resolver acceso de creación y retirar privilegios sobrantes con pruebas por rol. |
| Auxiliar y Administrador | Auxiliar tiene permisos de escritura en ciertos endpoints; Admin es superusuario de hecho. | Auxiliar: pendiente de confirmar; Admin no figura en la tabla objetivo. | Definir ambos antes de cerrar la matriz y las pruebas. |

### `SecurityConfig` y `/api/admin/**`

Existe una **tensión aparente** entre `/api/admin/**` (solo `ADMIN`) y las anotaciones de `UserManagementController` (también `GERENTE`/`DIRECCION`). En el código revisado, `SecurityConfig` declara **antes** de la regla general excepciones para `/api/admin/users` y `/api/admin/users/**`, y una excepción específica para `DELETE /api/admin/users/*` que admite Admin/Dirección. Spring Security evalúa esos matchers en orden: las rutas de usuarios cubiertas por esas excepciones no quedan bloqueadas por la regla posterior `/api/admin/**`. El alta, edición y consulta siguen sujetos a sus `@PreAuthorize`. Otros endpoints bajo `/api/admin/**` sin excepción sí requieren Admin; revisar cada nueva subruta al añadirla. La activación pública tiene matcher explícito. El riesgo es asumir que basta con la anotación del controlador o, al revés, que la regla general anula siempre las excepciones.

## Estilos y componentes reutilizables

La app carga [src/styles/index.css](../src/styles/index.css), que importa Tailwind 4. Predominan clases utilitarias directamente en JSX. [ui-tokens.ts](../src/shared/styles/ui-tokens.ts) reúne cadenas de clases para campos, avisos, botones y tablas; [cn.ts](../src/shared/lib/cn.ts) combina clases con `clsx` y `tailwind-merge`. [src/shared/components/ui](../src/shared/components/ui) ya contiene `Button`, `Input`, `Modal`, `MoneyInput`, `StatusBadge`, `PeriodFilter`, `DateRangeCalendarField`, filtros de tabla, `Pagination`, `QueryState`, `EmptyState` y selectores de cliente, banco y cuenta. El layout común está en `AdminLayout`, `Sidebar`, `Header` y `PageHeader`. Hay componentes de dominio reutilizados dentro de `operations`, `caja-general` y `corte`.

También permanecen [src/index.css](../src/index.css) y [src/App.css](../src/App.css) con estilos del template de Vite; `main.tsx` importa `src/styles/index.css`, por lo que esos archivos no son la fuente principal visible. Antes de rediseñar, confirmar referencias reales y evitar crear otra capa de estilos paralela.

## Riesgos para un rediseño grande

1. **Política de roles no alineada:** la matriz objetivo restringe escrituras que hoy permiten controladores, servicios o UI. Un cambio solo visual dejaría autorizaciones antiguas; uno solo de backend produciría botones que fallan con 403.
2. **Permisos dispersos:** `ROUTE_ACCESS` centraliza rutas, pero acciones siguen usando `hasRole`, `roles.includes`, reglas locales y `@PreAuthorize`; el rol Auxiliar y el Admin necesitan decisión explícita. Probar ruta, botón, endpoint y estado de negocio juntos.
3. **Pantallas compartidas con variaciones:** corte y detalle ya comparten componentes entre URL; duplicarlos por rol rompería consistencia. El rediseño pide modo consulta en las mismas pantallas.
4. **Listados ligados a la operación:** [ReturnsForPaymentPage.tsx](../src/modules/operations/pages/ReturnsForPaymentPage.tsx) consulta operaciones con filtros de fecha inicial `THIS_MONTH`; el objetivo pide retornos por **solicitud** y pendientes sin filtro temporal. Cambian contrato, paginación y contadores.
5. **Migraciones manuales y Hibernate `update`:** scripts SQL separados del arranque automático; un esquema local puede diferir del esperado. Validar orden y esquema en entorno aislado antes de cambios de modelo.
6. **Dinero y movimientos en tránsito:** caja, bancos, cheques, retornos y comisiones cruzan módulos. La secuencia de confirmación define cuándo cambian saldos; cualquier rediseño de acciones debe conservar pruebas de importes, permisos, concurrencia y bitácora.
7. **Sistema visual parcialmente compartido:** componentes base y tokens existen, pero muchas páginas repiten clases y usan modales donde el plan propone paneles laterales. Conviene consolidar piezas transversales antes de migrar pantallas.
8. **Rutas y documentos no siempre equivalen a funcionalidad activa:** hay rutas definidas sin pantalla registrada y páginas no montadas. Confirmar uso real antes de basar navegación nueva en el nombre de un archivo.
9. **Datos de sesión y caché:** Axios usa token persistido, React Query cachea solicitudes y notificaciones usan WebSocket. Cambiar permisos, contadores o navegación requiere invalidación y tratamiento de 401/403 coherentes.
10. **Pendiente — zona horaria de datos existentes:** Verificar si las fechas guardadas (ej. folio 41: 05:11:49) están en hora de la oficina o en UTC. Revisar antes de rediseñar pantallas que muestran hora (caja, cortes, detalle).

## Borrador de `CLAUDE.md`

La sección 2 del `CLAUDE.md` existente ya quedó completada con stack y comandos verificados. Para una revisión posterior del documento, propongo mantener sus reglas de negocio y añadir estas notas breves: (1) los dos repositorios son independientes y el backend reside en la ruta indicada arriba; (2) `docs/MAPA_DEL_CODIGO.md` describe el estado actual, mientras la sección 5 define permisos objetivo; (3) todo cambio de permisos debe contrastar `SecurityConfig`, `@PreAuthorize`, servicio, `ROUTE_ACCESS` y controles de la pantalla; (4) los SQL de `migrations/` requieren procedimiento explícito y no deben confundirse con `ddl-auto=update`; (5) confirmar el alcance de Auxiliar y Admin antes de implementar la matriz final. Este borrador no modifica `CLAUDE.md`.
