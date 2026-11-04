# Tutorial 13 · Administrar usuarios

- **Rol:** Director (Fernando Castillo, `director@tutorial.test`). El Gerente puede editar y desactivar,
  pero no crear ni eliminar.
- **Duración objetivo:** 1 min 30 s
- **Carpeta:** 5 Gerente y Director
- **Requiere:** que el botón "+ Nuevo usuario" se muestre al Director (hoy solo lo ve ADMIN).

## Preparación (no se graba)

Solo los usuarios ficticios del seed. El correo de activación del usuario nuevo llega a Mailpit
local, no a una bandeja real.

---

## Escena 1 · Portada (5 s)

- **En pantalla:** "Administrar usuarios" · "Director".
- **Narración:** "En este tutorial vas a dar de alta a un usuario, cambiar sus datos y desactivarlo."

## Escena 2 · La lista (10 s)

- **Acción:** **Administración › Usuarios**. Señalar el rol y el estado de cada persona.
- **Texto en pantalla:** "Administración › Usuarios"
- **Narración:** "En Usuarios ves a todas las personas del sistema, su rol y si su cuenta está activa y verificada."

## Escena 3 · Crear un usuario (30 s)

- **Acción:** **+ Nuevo usuario**: nombre **Andrea Ríos**, correo `auxiliar2@tutorial.test`, teléfono, rol **Auxiliar de Cuentas**. Crear.
- **Texto en pantalla:** "Nombre, correo y rol"
- **Narración:** "Presiona Nuevo usuario y captura su nombre, correo, teléfono y rol. Al guardarlo, el sistema le envía un correo para que active su cuenta y elija su contraseña."

## Escena 4 · Editar (15 s)

- **Acción:** en el menú **⋯** de Andrea Ríos, señalar **Editar** y **Actualizar correo** sin cambiar nada.
- **Texto en pantalla:** "Editar datos o correo"
- **Narración:** "Desde el menú de cada usuario puedes editar sus datos o cambiar su correo."

## Escena 5 · Desactivar (20 s)

- **Acción:** señalar que Andrea Ríos aparece **Inactivo** (aún no activa su cuenta). En el menú **⋯** de **Diana Flores**, **Desactivar** y confirmar. Señalar su estado inactivo.
- **Texto en pantalla:** "Desactivar en lugar de borrar"
- **Narración:** "El usuario nuevo aparece inactivo hasta que active su cuenta desde el correo. Si alguien deja de trabajar en la oficina, desactívalo: ya no podrá entrar y se conserva su historial. Eliminar es definitivo y pide escribir una palabra de confirmación."

## Escena 6 · Cierre (5 s)

- **En pantalla:** "Siguiente: Configuración".
- **Narración:** "En el siguiente tutorial verás la configuración del sistema."
