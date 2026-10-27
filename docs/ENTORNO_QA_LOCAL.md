# Entorno QA local

Este entorno separa las pruebas manuales de la base Docker original. La copia
`db_sistema_operaciones_qa` contiene los datos locales de partida más ocho cuentas
`qa.*@local.test`. La base `db_sistema_operaciones` no se usa para las pruebas.

| Servicio | Dirección QA |
| --- | --- |
| Frontend | `http://127.0.0.1:5175/` |
| Backend | `http://127.0.0.1:8081/` |
| MySQL QA | `127.0.0.1:3306/db_sistema_operaciones_qa` |
| Firebase Storage Emulator | `http://127.0.0.1:9199/` |
| Correo capturado por Mailpit | `http://127.0.0.1:8025/` |

## Cuentas de prueba

Las cuentas son `qa.socio@local.test`, `qa.socio2@local.test`, `qa.cajas@local.test`,
`qa.cuentas@local.test`, `qa.auxiliar@local.test`, `qa.gerente@local.test`,
`qa.director@local.test` y `qa.admin@local.test`. Los dos Socios comparten el
rol `SOCIO_COMERCIAL`; los demás tienen solo su rol homónimo. La contraseña
temporal está en `/private/tmp/sdo-qa-login.txt`, con
permisos de lectura solo para el usuario local. No se guarda en Git.

## Arranque

1. Abrir Docker Desktop y esperar a que `sistemadeoperaciones-mysql-1` esté
   saludable. La copia QA está en el mismo contenedor, en otra base.
2. Iniciar Mailpit si no está corriendo:

   ```sh
   docker run --rm -d --name sdo-qa-mailpit \
     -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:latest
   ```

3. Desde la raíz del frontend, iniciar Storage Emulator con Java 21 o superior:

   ```sh
   python3 scripts/run-qa-storage.py
   ```

   El script usa el Java 25 instalado en esta Mac y conserva los archivos del
   emulador en `.qa-local/firebase-data`, excluido de Git.

4. Desde la raíz del frontend, iniciar el backend en otra terminal:

   ```sh
   python3 scripts/run-qa-backend.py \
     "/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones"
   ```

5. Iniciar el frontend QA en otra terminal:

   ```sh
   VITE_API_URL=http://127.0.0.1:8081 \
   VITE_FIREBASE_STORAGE_EMULATOR=true \
   npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
   ```

El backend usa siempre el perfil `local`, la base QA, Hibernate en modo
`validate` y la zona horaria `America/Mexico_City`. El frontend QA usa el
proyecto Firebase de demostración y conecta Storage a `127.0.0.1:9199`;
una subida falla si el emulador está apagado, sin recurrir al bucket compartido.

## Comprobación rápida

```sh
VITE_FIREBASE_STORAGE_EMULATOR=true \
VITE_API_URL=http://127.0.0.1:8081 \
node scripts/check-qa-storage.mjs
```

La comprobación sube, lee y borra un archivo sintético en el emulador. Las
cuentas QA se probaron con `POST /api/auth/login` en el backend QA. Para las
pruebas de negocio, usar operaciones y comprobantes nuevos creados en QA:
los registros históricos copiados pueden conservar URL de comprobantes del
almacenamiento compartido.
