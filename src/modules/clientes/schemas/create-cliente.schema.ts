import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del cliente es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  nivelesRedComercial: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'Los niveles de red comercial son obligatorios' })
      .min(1, 'El mínimo de niveles es 1')
      .max(3, 'El máximo de niveles es 3'),
  ),

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

export type CreateClienteFormInput = z.input<typeof createClienteSchema>;
export type CreateClienteFormValues = z.output<typeof createClienteSchema>;