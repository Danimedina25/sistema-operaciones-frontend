# Contrato de integridad comercial requerido en backend

El frontend envía una copia de los porcentajes dentro de cada operación. El backend debe tratar las configuraciones de usuarios y socios comerciales únicamente como valores sugeridos para nuevas operaciones.

## Clientes

- `POST /api/clientes` debe aceptar `userId` únicamente para roles administrativos autorizados.
- Para `SOCIO_COMERCIAL`, debe ignorar o rechazar un `userId` diferente al usuario autenticado.
- El `userId` seleccionado debe existir, estar activo y tener rol `SOCIO_COMERCIAL`.
- Cada cliente debe conservar un único propietario nivel 1.

## Operaciones

- Para `SOCIO_COMERCIAL`, `socioComercialId` debe coincidir con el usuario autenticado.
- Para `ADMIN`, el nivel 1 debe existir, estar activo y tener rol `SOCIO_COMERCIAL`.
- El cliente debe pertenecer al `socioComercialId` de la operación.
- Los socios nivel 2 y 3 deben existir, estar activos, ser diferentes entre sí y pertenecer a la red autorizada del nivel 1.
- Si `nivelesRedComercial` es 2 o 3, los identificadores y porcentajes correspondientes son obligatorios.
- Los porcentajes deben ser no negativos y la suma oficina + nivel 1 + nivel 2 + nivel 3 no debe superar 100%.
- Los porcentajes recibidos deben almacenarse en la operación como valores históricos independientes. Cambiar un porcentaje sugerido en usuarios o socios no debe modificar operaciones existentes.

## Sesión

La respuesta de login debe incluir `porcentajeComision` o `commercialSettings.porcentajeComision` para que un socio nivel 1 reciba su valor sugerido al crear una operación.
