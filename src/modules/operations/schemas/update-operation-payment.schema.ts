import { z } from 'zod';

function parseCurrency(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const updateOperationPaymentSchema = z.object({
  monto: z
    .string()
    .min(1, 'El monto es obligatorio')
    .transform(parseCurrency)
    .refine((value) => value > 0, {
      message: 'El monto debe ser mayor a cero',
    }),

  tipoPago: z.enum(
    ['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO'],
    {
      message: 'El tipo de pago es obligatorio',
    },
  ),

  cuentaDestinoId: z.coerce
    .number()
    .refine((value) => value > 0, {
      message: 'La cuenta destino es obligatoria',
    }),

  comprobante: z.any().optional(),

  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
});

export type UpdateOperationPaymentFormInput =
  z.input<typeof updateOperationPaymentSchema>;

export type UpdateOperationPaymentFormValues =
  z.output<typeof updateOperationPaymentSchema>;