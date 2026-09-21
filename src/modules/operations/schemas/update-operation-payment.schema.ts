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
    ['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'CHEQUE'],
    {
      message: 'El tipo de pago es obligatorio',
    },
  ),

  fechaComprobante: z
    .string()
    .min(1, 'La fecha del comprobante es obligatoria'),

  cuentaDestinoId: z.preprocess((v) => v === '' || v == null ? null : Number(v), z.number().nullable()),

  numeroCheque: z.string().optional(),
  bancoEmisor: z.string().optional(),
  emisor: z.string().optional(),
  beneficiario: z.string().optional(),
  comprobante: z.any().optional(),

  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
}).superRefine((value, ctx) => {
  if (value.tipoPago === 'CHEQUE') {
    for (const field of ['numeroCheque', 'bancoEmisor', 'emisor', 'beneficiario'] as const) {
      if (!value[field]?.trim()) ctx.addIssue({ code: 'custom', path: [field], message: 'Este dato del cheque es obligatorio' });
    }
  }
  if (['TRANSFERENCIA', 'DEPOSITO'].includes(value.tipoPago) && (!value.cuentaDestinoId || value.cuentaDestinoId < 1)) {
    ctx.addIssue({ code: 'custom', path: ['cuentaDestinoId'], message: 'La cuenta destino es obligatoria' });
  }
});

export type UpdateOperationPaymentFormInput =
  z.input<typeof updateOperationPaymentSchema>;

export type UpdateOperationPaymentFormValues =
  z.output<typeof updateOperationPaymentSchema>;