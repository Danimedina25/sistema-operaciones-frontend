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

  socioComercialNivel2Id: z.preprocess(
    (value) => {
      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {
        return undefined;
      }

      return Number(value);
    },
    z.number().optional(),
  ),

  socioComercialNivel3Id: z.preprocess(
    (value) => {
      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {
        return undefined;
      }

      return Number(value);
    },
    z.number().optional(),
  ),

  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
})
  .superRefine((value, ctx) => {
    if (
      value.socioComercialNivel3Id &&
      !value.socioComercialNivel2Id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['socioComercialNivel3Id'],
        message:
          'Debe seleccionar un socio comercial nivel 2 antes del nivel 3',
      });
    }
  });

export type UpdateOperationFormInput = z.input<typeof updateOperationSchema>;
export type UpdateOperationFormValues = z.output<typeof updateOperationSchema>;