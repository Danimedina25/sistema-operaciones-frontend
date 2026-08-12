import { z } from 'zod';

export const createClienteSchema = z.object({
  userId: z.coerce.number().min(1, 'Selecciona el socio comercial nivel 1'),
  nombre: z
    .string()
    .min(1, 'El nombre del cliente es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

export type CreateClienteFormInput = z.input<typeof createClienteSchema>;
export type CreateClienteFormValues = z.output<typeof createClienteSchema>;
