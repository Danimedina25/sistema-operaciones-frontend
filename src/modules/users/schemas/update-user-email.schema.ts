import { z } from 'zod';

export const updateUserEmailSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('El correo no tiene un formato válido')
    .max(150, 'El correo no puede exceder 150 caracteres'),
});

export type UpdateUserEmailFormValues = z.infer<typeof updateUserEmailSchema>;