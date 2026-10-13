# Usuarios para revisar el menú en local

Con el esquema del backend ya creado en el MySQL **local** (`127.0.0.1:3306`, base `db_sistema_operaciones`) y los comandos `mysql` y `htpasswd` disponibles, ejecuta desde la raíz de este frontend:

```bash
bash scripts/create-local-test-users.sh
```

El script usa TCP hacia `127.0.0.1`, ignora archivos de opciones de MySQL y rechaza `MYSQL_HOST` o `DB_HOST` distintos. Solicita la contraseña del usuario MySQL local en la terminal. No ejecuta migraciones ni se conecta al servidor de producción. Se puede repetir: actualiza solo los siete usuarios de prueba. Si existen con el dominio anterior `@local`, cambia sus correos a `@prueba.test` conservando sus IDs y relaciones.
Por defecto usa el usuario MySQL `root`; para otro usuario local, ejecuta `LOCAL_MYSQL_USER=tu_usuario bash scripts/create-local-test-users.sh`.

| Rol | Correo |
| --- | --- |
| Socio Comercial | `prueba.socio@prueba.test` |
| Jefa de Cajas | `prueba.cajas@prueba.test` |
| Jefa de Cuentas | `prueba.cuentas@prueba.test` |
| Auxiliar de Cuentas | `prueba.auxiliar@prueba.test` |
| Gerente | `prueba.gerente@prueba.test` |
| Director | `prueba.director@prueba.test` |
| Administrador | `prueba.admin@prueba.test` |

Contraseña de todas: `LocalSolo2026!`.

El script de usuarios no asigna operaciones. La base local usada en la revisión del rediseño ya puede tener operaciones vinculadas al Socio de prueba (incluida la operación #43 del recorrido de la etapa 7). En una base local nueva, inicia sesión como `prueba.socio@prueba.test`, crea un cliente en **Mi red › Clientes** y después una operación en **Operaciones** para ver datos propios.
