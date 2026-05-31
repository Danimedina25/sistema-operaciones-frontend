// src/modules/socioscomerciales/schemas/create-commercial-partner.schema.ts

import { z } from 'zod';

export const createCommercialPartnerSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre no puede exceder 150 caracteres'),

  cuentaBancaria: z
    .string()
    .trim()
    .regex(
      /^\d{18}$/,
      'La CLABE interbancaria debe contener exactamente 18 dígitos',
    ),

  banco: z
    .string()
    .min(1, 'El banco es obligatorio')
    .max(100, 'El banco no puede exceder 100 caracteres'),

  titularCuenta: z
    .string()
    .min(1, 'El titular de la cuenta es obligatorio')
    .max(150, 'El titular de la cuenta no puede exceder 150 caracteres'),

  activo: z.boolean().optional().default(true),

  nivel: z.preprocess(
    (value) => {
      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {
        return undefined;
      }

      return Number(value);
    },
    z.number({
      error: 'Debe seleccionar un nivel',
    }).refine(
      (value) => value === 2 || value === 3,
      'Debe seleccionar un nivel válido',
    ),
  ),
});
export type CreateCommercialPartnerFormInput =
  z.input<typeof createCommercialPartnerSchema>;

export type CreateCommercialPartnerFormValues =
  z.output<typeof createCommercialPartnerSchema>;