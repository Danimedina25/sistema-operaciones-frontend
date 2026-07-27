// src/modules/configuraciones/schemas/update-configuracion-general.schema.ts

import { z } from 'zod';

export const updateConfiguracionGeneralSchema = z.object({
  porcentajeComisionOficina: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'El porcentaje de comisión de oficina es obligatorio' })
      .min(0, 'El porcentaje de comisión de oficina no puede ser negativo')
      .max(100, 'El porcentaje de comisión de oficina no puede ser mayor a 100'),
  ),
});

export type UpdateConfiguracionGeneralFormInput =
  z.input<typeof updateConfiguracionGeneralSchema>;

export type UpdateConfiguracionGeneralFormValues =
  z.output<typeof updateConfiguracionGeneralSchema>;
