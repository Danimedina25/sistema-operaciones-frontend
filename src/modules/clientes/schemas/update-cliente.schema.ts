import { z } from 'zod';

export const updateClienteSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del cliente es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  activo: z.boolean(),
});

export type UpdateClienteFormInput = z.input<typeof updateClienteSchema>;
export type UpdateClienteFormValues = z.output<typeof updateClienteSchema>;
