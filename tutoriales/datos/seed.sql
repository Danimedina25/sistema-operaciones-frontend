-- Datos ficticios para grabar tutoriales. Solo se cargan en
-- db_sistema_operaciones_tutorial (MySQL local); nombres, cuentas y CLABE son inventados.
-- @HASH@ lo sustituye seed.sh con el BCrypt de la contraseña de tutoriales.
START TRANSACTION;

INSERT INTO users (id, nombre, correo, password, telefono, activo, debe_cambiar_password, correo_verificado, created_at, updated_at) VALUES
  (101, 'Laura Méndez', 'socio@tutorial.test', '@HASH@', '5500000101', 1, 0, 1, NOW(), NOW()),
  (102, 'Patricia Ruiz', 'cajas@tutorial.test', '@HASH@', '5500000102', 1, 0, 1, NOW(), NOW()),
  (103, 'Gabriela Soto', 'cuentas@tutorial.test', '@HASH@', '5500000103', 1, 0, 1, NOW(), NOW()),
  (104, 'Diana Flores', 'auxiliar@tutorial.test', '@HASH@', '5500000104', 1, 0, 1, NOW(), NOW()),
  (105, 'Roberto Aguilar', 'gerente@tutorial.test', '@HASH@', '5500000105', 1, 0, 1, NOW(), NOW()),
  (106, 'Fernando Castillo', 'director@tutorial.test', '@HASH@', '5500000106', 1, 0, 1, NOW(), NOW());

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = CASE u.id
  WHEN 101 THEN 'SOCIO_COMERCIAL'
  WHEN 102 THEN 'JEFA_CAJAS'
  WHEN 103 THEN 'JEFA_CUENTAS'
  WHEN 104 THEN 'AUXILIAR_CUENTAS'
  WHEN 105 THEN 'GERENTE'
  WHEN 106 THEN 'DIRECCION'
END WHERE u.id BETWEEN 101 AND 106;

INSERT INTO commercial_partner_settings (applies_to_network, created_at, updated_at, updated_by, user_id, banco, cuenta_bancaria, titular_cuenta, porcentaje_comision) VALUES
  (b'0', NOW(6), NOW(6), NULL, 101, 'BANCO DEMO', '000000000000001011', 'Laura Méndez', 1.00);

INSERT INTO clientes (activo, created_at, niveles_red_comercial, nombre, porcentaje_comision_socio, porcentaje_comision_oficina, updated_at, user_id) VALUES
  (b'1', NOW(6), 1, 'Alejandro Torres', 1.00, 1.50, NOW(6), 101),
  (b'1', NOW(6), 2, 'Sofía Herrera', 1.00, 1.50, NOW(6), 101),
  (b'1', NOW(6), 1, 'Miguel Castro', 1.00, 1.50, NOW(6), 101);

INSERT INTO commercial_partners (activo, nombre, banco, created_at, cuenta_bancaria, titular_cuenta, updated_at, user_id, porcentaje_comision, commission_configured) VALUES
  (b'1', 'Jorge Navarro', 'BANCO DEMO', NOW(6), '000000000000003011', 'Jorge Navarro', NOW(6), 101, 0.50, b'1'),
  (b'1', 'Mariana Vega', 'BANCO EJEMPLO', NOW(6), '000000000000003022', 'Mariana Vega', NOW(6), 101, 0.50, b'1');

INSERT INTO bank_accounts (activo, banco, clabe, created_at, numero_cuenta, titular, updated_at) VALUES
  (b'1', 'BANCO DEMO', '000000000000001234', NOW(6), '0000001234', 'Oficina Demo SA de CV', NOW(6)),
  (b'1', 'BANCO EJEMPLO', '000000000000005678', NOW(6), '0000005678', 'Oficina Demo SA de CV', NOW(6));

COMMIT;
