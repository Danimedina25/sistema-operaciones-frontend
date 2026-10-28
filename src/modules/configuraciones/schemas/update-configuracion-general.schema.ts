// src/modules/configuraciones/schemas/update-configuracion-general.schema.ts

import { z } from 'zod';

const hours = (label: string) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z
    .number({ error: `Las horas para ${label} son obligatorias` })
    .int(`Las horas para ${label} deben ser un número entero`)
    .min(1, `Las horas para ${label} deben ser al menos 1`)
    .max(720, `Las horas para ${label} no pueden superar 720`),
);

export const updateConfiguracionGeneralSchema = z.object({
  horasPendienteAtencion: hours('atender pronto'),
  horasPendienteUrgente: hours('urgente'),
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
}).refine(values => values.horasPendienteUrgente > values.horasPendienteAtencion, {
  path: ['horasPendienteUrgente'],
  message: 'Las horas para urgente deben ser mayores que las de atender pronto',
});

export type UpdateConfiguracionGeneralFormInput =
  z.input<typeof updateConfiguracionGeneralSchema>;

export type UpdateConfiguracionGeneralFormValues =
  z.output<typeof updateConfiguracionGeneralSchema>;
