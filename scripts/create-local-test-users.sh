#!/usr/bin/env bash
set -euo pipefail

# Solo admite el MySQL del perfil local del backend. --no-defaults evita que
# ~/.my.cnf cambie el host o el protocolo sin que el operador lo vea.
if [[ "${MYSQL_HOST:-127.0.0.1}" != '127.0.0.1' || "${DB_HOST:-127.0.0.1}" != '127.0.0.1' ]]; then
  echo 'Rechazado: los usuarios de prueba solo se crean en 127.0.0.1.' >&2
  exit 1
fi

command -v mysql >/dev/null || { echo 'Falta el cliente mysql.' >&2; exit 1; }
command -v htpasswd >/dev/null || { echo 'Falta htpasswd para generar BCrypt.' >&2; exit 1; }

database='db_sistema_operaciones'
database_user="${LOCAL_MYSQL_USER:-root}"
if [[ ! "$database_user" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo 'LOCAL_MYSQL_USER inválido.' >&2
  exit 1
fi

read -r -s -p 'Contraseña del usuario MySQL local: ' database_password
printf '\n'
export MYSQL_PWD="$database_password"
trap 'unset MYSQL_PWD database_password' EXIT

mysql_local=(mysql --no-defaults --protocol=TCP --host=127.0.0.1 --port=3306
  --user="$database_user" --database="$database" --batch --skip-column-names)

# La conexión y el esquema quedan fijados antes de cualquier escritura.
tables="$("${mysql_local[@]}" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('users','roles','user_roles','commercial_partner_settings')")"
if [[ "$tables" != '4' ]]; then
  echo 'Faltan tablas del backend en el MySQL local; no se escribió nada.' >&2
  exit 1
fi

test_password='LocalSolo2026!'
password_hash="$(htpasswd -bnBC 10 prueba "$test_password" | cut -d: -f2 | tr -d '\n')"
if [[ ! "$password_hash" =~ ^\$2[aby]\$ ]]; then
  echo 'No se pudo generar una contraseña BCrypt válida.' >&2
  exit 1
fi

"${mysql_local[@]}" <<SQL
START TRANSACTION;
-- Conserva los IDs y las relaciones de las cuentas creadas con el dominio
-- anterior, que el formulario de acceso rechaza como correo inválido.
UPDATE users SET correo = REPLACE(correo, '@local', '@prueba.test'), updated_at = NOW()
WHERE correo IN ('prueba.socio@local','prueba.cajas@local','prueba.cuentas@local',
  'prueba.auxiliar@local','prueba.gerente@local','prueba.director@local','prueba.admin@local');

INSERT INTO roles (name) VALUES
  ('SOCIO_COMERCIAL'), ('JEFA_CAJAS'), ('JEFA_CUENTAS'),
  ('AUXILIAR_CUENTAS'), ('GERENTE'), ('DIRECCION'), ('ADMIN')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (nombre, correo, password, telefono, activo, debe_cambiar_password, correo_verificado, created_at, updated_at) VALUES
  ('Socio de prueba', 'prueba.socio@prueba.test', '$password_hash', '5555550001', 1, 0, 1, NOW(), NOW()),
  ('Jefa de Cajas de prueba', 'prueba.cajas@prueba.test', '$password_hash', '5555550002', 1, 0, 1, NOW(), NOW()),
  ('Jefa de Cuentas de prueba', 'prueba.cuentas@prueba.test', '$password_hash', '5555550003', 1, 0, 1, NOW(), NOW()),
  ('Auxiliar de Cuentas de prueba', 'prueba.auxiliar@prueba.test', '$password_hash', '5555550004', 1, 0, 1, NOW(), NOW()),
  ('Gerente de prueba', 'prueba.gerente@prueba.test', '$password_hash', '5555550005', 1, 0, 1, NOW(), NOW()),
  ('Director de prueba', 'prueba.director@prueba.test', '$password_hash', '5555550006', 1, 0, 1, NOW(), NOW()),
  ('Administrador de prueba', 'prueba.admin@prueba.test', '$password_hash', '5555550007', 1, 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password), activo = 1,
  debe_cambiar_password = 0, correo_verificado = 1, updated_at = NOW();

DELETE user_roles FROM user_roles JOIN users ON users.id = user_roles.user_id
WHERE users.correo IN ('prueba.socio@prueba.test','prueba.cajas@prueba.test','prueba.cuentas@prueba.test',
  'prueba.auxiliar@prueba.test','prueba.gerente@prueba.test','prueba.director@prueba.test','prueba.admin@prueba.test');

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id FROM users JOIN roles ON roles.name = CASE users.correo
  WHEN 'prueba.socio@prueba.test' THEN 'SOCIO_COMERCIAL'
  WHEN 'prueba.cajas@prueba.test' THEN 'JEFA_CAJAS'
  WHEN 'prueba.cuentas@prueba.test' THEN 'JEFA_CUENTAS'
  WHEN 'prueba.auxiliar@prueba.test' THEN 'AUXILIAR_CUENTAS'
  WHEN 'prueba.gerente@prueba.test' THEN 'GERENTE'
  WHEN 'prueba.director@prueba.test' THEN 'DIRECCION'
  WHEN 'prueba.admin@prueba.test' THEN 'ADMIN'
END WHERE users.correo IN ('prueba.socio@prueba.test','prueba.cajas@prueba.test','prueba.cuentas@prueba.test',
  'prueba.auxiliar@prueba.test','prueba.gerente@prueba.test','prueba.director@prueba.test','prueba.admin@prueba.test');

INSERT INTO commercial_partner_settings
  (user_id, applies_to_network, cuenta_bancaria, banco, titular_cuenta, porcentaje_comision, created_at, updated_at)
SELECT id, 1, '000000000000000000', 'BANORTE', 'Socio de prueba', 1.00, NOW(), NOW()
FROM users WHERE correo = 'prueba.socio@prueba.test'
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);
COMMIT;
SQL

echo 'Usuarios de prueba creados solo en MySQL 127.0.0.1:3306.'
echo "Contraseña de las siete cuentas: $test_password"
