import { z } from 'zod';

function parseCurrencyInput(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) {
      return undefined;
    }

    return Number(normalized);
  }

  return value;
}

const paymentTypeSchema = z.enum(['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO'], {
  error: 'El tipo de pago es obligatorio',
});

const paymentSchema = z
  .object({
    monto: z.preprocess(
      parseCurrencyInput,
      z.number({ error: 'El monto del pago es obligatorio' }).min(0, {
        error: 'El monto del pago no puede ser negativo',
      }),
    ),

    tipoPago: z.union([paymentTypeSchema, z.literal('')]).optional(),

    cuentaDestinoId: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z.number().optional(),
    ),

    comprobante: z.any().optional(),

    observaciones: z
      .string()
      .max(500, 'Las observaciones del pago no pueden exceder 500 caracteres')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    if (value.monto > 0) {
      if (!value.tipoPago) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tipoPago'],
          message: 'El tipo de pago es obligatorio cuando el monto es mayor a cero',
        });
      }

      if (!value.cuentaDestinoId || value.cuentaDestinoId < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaDestinoId'],
          message: 'La cuenta destino es obligatoria cuando el monto es mayor a cero',
        });
      }

      const fileValue = value.comprobante;

      const hasFile =
        fileValue instanceof File ||
        (fileValue instanceof FileList && fileValue.length > 0);

      if (!hasFile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['comprobante'],
          message: 'El comprobante es obligatorio cuando el monto es mayor a cero',
        });
      }
    }
  });

export const createOperationSchema = z
  .object({
    clienteId: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z
        .number({ error: 'El cliente es obligatorio' })
        .min(1, 'El cliente es obligatorio'),
    ),

    montoTotal: z.preprocess(
      parseCurrencyInput,
      z.number({ error: 'El monto total es obligatorio' }).min(0.01, {
        error: 'El monto total debe ser mayor a cero',
      }),
    ),

    observaciones: z
      .string()
      .max(500, 'Las observaciones no pueden exceder 500 caracteres')
      .optional()
      .or(z.literal('')),

    pagos: z.array(paymentSchema).min(1, 'Debes registrar al menos un pago'),
  })
  .superRefine((value, ctx) => {
    const totalPagos = value.pagos.reduce((acc, pago) => acc + pago.monto, 0);

    if (totalPagos > value.montoTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pagos'],
        message: 'La suma de los pagos no puede exceder el monto total de la operación',
      });
    }

    const pagosConMonto = value.pagos.filter((pago) => pago.monto > 0);

    if (pagosConMonto.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pagos'],
        message: 'Debes registrar al menos un pago con monto mayor a cero y su comprobante',
      });
    }
  });

export type CreateOperationFormInput = z.input<typeof createOperationSchema>;
export type CreateOperationFormValues = z.output<typeof createOperationSchema>;