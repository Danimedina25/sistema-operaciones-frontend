import { z } from 'zod';

function parseCurrency(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const updateOperationSchema = z.object({
  clienteId: z.coerce
    .number()
    .refine((value) => value > 0, {
      message: 'El cliente es obligatorio',
    }),

  montoTotal: z
    .string()
    .min(1, 'El monto total es obligatorio')
    .transform(parseCurrency)
    .refine((value) => value > 0, {
      message: 'El monto total debe ser mayor a cero',
    }),

  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
});

export type UpdateOperationFormInput = z.input<typeof updateOperationSchema>;
export type UpdateOperationFormValues = z.output<typeof updateOperationSchema>;