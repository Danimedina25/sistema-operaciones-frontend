# Tutoriales en video

Videos cortos de las funciones principales, grabados automáticamente sobre una base de datos
local con datos ficticios. Si una pantalla cambia, el video se vuelve a generar con un comando.

## Carpetas

| Carpeta | Contenido |
| --- | --- |
| `guiones/` | Un `.md` por tutorial: escenas, narración y textos en pantalla. Se revisan antes de grabar. |
| `scripts/tutoriales/` | La versión ejecutable de cada guion: narración por frase y acciones de Playwright. |
| `scripts/` | Motor de grabación (`tutorial.mjs`), capa visual (`overlay.mjs`), datos (`seed.sh`), backend (`run-backend.py`) y comprobantes (`comprobantes.mjs`). |
| `datos/seed.sql` | Usuarios, clientes, socios y cuentas ficticios. |
| `comprobantes/` | Imágenes de comprobantes ficticios con sello "EJEMPLO". |
| `salida/` | Videos generados. Excluida de Git. |

## Entorno

Los tutoriales usan la base `db_sistema_operaciones_tutorial` en el MySQL local de Docker, nunca
la base QA ni producción. Esta tiene datos copiados que no deben aparecer en un video.

1. Docker Desktop con `sistemadeoperaciones-mysql-1` saludable.
2. Storage Emulator (desde la raíz del frontend):

   ```sh
   npm_config_cache="$PWD/.qa-local/npm-cache" python3 scripts/run-qa-storage.py
   ```

3. Backend de tutoriales:

   ```sh
   python3 tutoriales/scripts/run-backend.py "/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones"
   ```

4. Frontend:

   ```sh
   VITE_API_URL=http://127.0.0.1:8081 VITE_FIREBASE_STORAGE_EMULATOR=true \
     npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
   ```

La contraseña de los usuarios ficticios (`socio@tutorial.test`, `cajas@tutorial.test`,
`cuentas@tutorial.test`, `auxiliar@tutorial.test`, `gerente@tutorial.test`,
`director@tutorial.test`) se genera en `.qa-local/tutorial-login.txt`, fuera de Git.

### Crear la base por primera vez

El usuario `sdo_local` no puede crear bases. Se hace una vez con el root del contenedor:

```sh
set -a; source "/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones/.env.local"; set +a
docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" sistemadeoperaciones-mysql-1 mysql -uroot -e \
  "CREATE DATABASE db_sistema_operaciones_tutorial CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON db_sistema_operaciones_tutorial.* TO 'sdo_local'@'%';"
docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" sistemadeoperaciones-mysql-1 sh -c \
  "mysqldump -uroot --no-data --skip-triggers db_sistema_operaciones_qa | mysql -uroot db_sistema_operaciones_tutorial &&
   mysqldump -uroot --no-create-info db_sistema_operaciones_qa roles configuracion_general | mysql -uroot db_sistema_operaciones_tutorial"
```

Si el backend cambia de esquema, aplica la migración nueva de `migrations/` también a esta base.

## Generar un video

```sh
npm run tutorial -- 02
```

Cada corrida recarga los datos ficticios, genera la voz (Paulina, voz de macOS), graba el
recorrido y deja `salida/02-crear-operacion.mp4` en 1920 × 1080.

## Agregar un tutorial

1. Escribe el guion en `guiones/NN-nombre.md` y apruébalo.
2. Si necesita comprobantes nuevos, agrégalos en `scripts/comprobantes.mjs` y córrelo.
3. Crea `scripts/tutoriales/NN-nombre.mjs` con las escenas, siguiendo el de `02`.
4. Corre `npm run tutorial -- NN` y revisa el video.
