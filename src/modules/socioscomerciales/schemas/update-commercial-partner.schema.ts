// src/modules/socioscomerciales/schemas/update-commercial-partner.schema.ts

import { z } from 'zod';

export const updateCommercialPartnerSchema = z.object({
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

  activo: z.boolean().optional()
});

export type UpdateCommercialPartnerFormInput =
  z.input<typeof updateCommercialPartnerSchema>;

export type UpdateCommercialPartnerFormValues =
  z.output<typeof updateCommercialPartnerSchema>;