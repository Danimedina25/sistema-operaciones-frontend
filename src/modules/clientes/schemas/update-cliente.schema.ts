import { z } from 'zod';

export const updateClienteSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del cliente es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  activo: z.boolean(),

  porcentajeComisionAplicado: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'El porcentaje de comisión es obligatorio' })
      .min(0, 'El porcentaje no puede ser negativo')
      .max(100, 'El porcentaje no puede ser mayor a 100'),
  ),
});

export type UpdateClienteFormInput = z.input<typeof updateClienteSchema>;
export type UpdateClienteFormValues = z.output<typeof updateClienteSchema>;