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

export function createAddPaymentSchema(maxMontoPermitido: number) {
  return z.object({
    operacionId: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z.number({ error: 'La operación es obligatoria' }).min(1, {
        error: 'La operación es obligatoria',
      }),
    ),

    monto: z.preprocess(
      parseCurrencyInput,
      z
        .number({ error: 'El monto es obligatorio' })
        .min(0.01, {
          error: 'El monto debe ser mayor a cero',
        })
        .refine((value) => value <= maxMontoPermitido, {
          message: `El monto no puede exceder el faltante de ${maxMontoPermitido.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        }),
    ),

    tipoPago: z.enum(['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO'], {
      error: 'El tipo de pago es obligatorio',
    }),

    comprobanteUrl: z
      .string()
      .trim()
      .min(1, 'La URL del comprobante es obligatoria')
      .max(500, 'La URL del comprobante no puede exceder 500 caracteres'),

    observaciones: z
      .string()
      .max(500, 'Las observaciones no pueden exceder 500 caracteres')
      .optional()
      .or(z.literal('')),
  });
}

export type AddPaymentFormInput = {
  operacionId: string;
  monto: string;
  tipoPago: '' | 'TRANSFERENCIA' | 'DEPOSITO' | 'EFECTIVO';
  comprobanteUrl: string;
  observaciones?: string;
};

export type AddPaymentFormValues = {
  operacionId: number;
  monto: number;
  tipoPago: 'TRANSFERENCIA' | 'DEPOSITO' | 'EFECTIVO';
  comprobanteUrl: string;
  observaciones?: string;
};