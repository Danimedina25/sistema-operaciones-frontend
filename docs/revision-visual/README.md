# Revisión visual de Abrir/Cerrar caja

Comparación de los frames C4 (`23:830`) y C5 (`23:1072`) del archivo `Fv3iaaYtIn8vvW8qusbI3P` con `/caja-general?nav=cash-session`.

| Estado | Figma | Local |
| --- | --- | --- |
| Cerrar caja | [Frame C4](figma-c4-cerrar-caja.png) | [Antes](local-antes-cerrar-caja.png) · [Después, 1600 px](local-despues-cerrar-caja-1600.png) · [1440 px](local-despues-cerrar-caja.png) · [1024 px](local-despues-cerrar-caja-1024.png) · [390 px](local-despues-cerrar-caja-movil.png) |
| Abrir caja | [Frame C5](figma-c5-abrir-caja.png) | [Después, 1600 px](local-despues-abrir-caja-1600.png) · [1440 px](local-despues-abrir-caja.png) |

Las capturas de cierre muestran el estado real del MySQL local de `prueba.cajas@prueba.test` el 13 oct 2026. La captura de apertura usa la misma sesión y datos del último corte, con respuestas de lectura simuladas en Chrome para representar la caja cerrada y el día actual sin corte. No se ejecutó ninguna escritura en MySQL para esa captura.

Las observaciones de apertura del frame C5 se omiten porque la API no las guarda. La apertura conserva el saldo y las denominaciones del último cierre, tal como exige el flujo actual. Ambas diferencias están registradas en `docs/PENDIENTES_FASE2.md` o en el propio formulario.
