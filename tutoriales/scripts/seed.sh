#!/usr/bin/env bash
# Recrea los datos ficticios de tutoriales en db_sistema_operaciones_tutorial.
# Uso: tutoriales/scripts/seed.sh "/ruta/al/backend"
set -euo pipefail

backend="${1:?Uso: seed.sh /ruta/al/backend}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
database='db_sistema_operaciones_tutorial'
login_file="$root/.qa-local/tutorial-login.txt"

set -a; source "$backend/.env.local"; set +a
export MYSQL_PWD="$MYSQL_PASSWORD"
mysql_local=(mysql --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306
  --user="$MYSQL_USER" --database="$database" --batch --skip-column-names)

# La contraseña se genera una vez y vive fuera de Git.
mkdir -p "$root/.qa-local"
if [[ ! -s "$login_file" ]]; then
  umask 077
  printf 'Tutorial-%s!\n' "$(openssl rand -hex 6)" > "$login_file"
fi
password="$(head -n1 "$login_file")"
hash="$(htpasswd -bnBC 10 tutorial "$password" | cut -d: -f2 | tr -d '\n')"

# Vacía todas las tablas salvo los catálogos copiados de QA.
tables="$("${mysql_local[@]}" -e "SELECT table_name FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name NOT IN ('roles','configuracion_general')")"
{
  echo 'SET FOREIGN_KEY_CHECKS = 0;'
  for table in $tables; do echo "TRUNCATE TABLE \`$table\`;"; done
  echo 'SET FOREIGN_KEY_CHECKS = 1;'
  sed "s|@HASH@|$hash|g" "$root/tutoriales/datos/seed.sql"
} | "${mysql_local[@]}"

echo "Datos de tutoriales cargados en $database. Contraseña: $login_file"
