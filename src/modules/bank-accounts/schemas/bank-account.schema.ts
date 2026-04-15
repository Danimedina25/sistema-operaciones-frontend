import { z } from 'zod';

export const bankAccountSchema = z.object({
  banco: z
    .string()
    .trim()
    .min(1, 'El banco es obligatorio')
    .max(100, 'El banco no puede exceder 100 caracteres'),

  titular: z
    .string()
    .trim()
    .min(1, 'El titular es obligatorio')
    .max(150, 'El titular no puede exceder 150 caracteres'),

  numeroCuenta: z
    .string()
    .trim()
    .min(1, 'El número de cuenta es obligatorio')
    .max(30, 'El número de cuenta no puede exceder 30 caracteres'),

  clabe: z
    .string()
    .trim()
    .regex(/^\d{18}$/, 'La CLABE debe tener exactamente 18 dígitos'),
});

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;