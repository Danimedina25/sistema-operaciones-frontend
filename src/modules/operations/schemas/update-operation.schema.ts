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

  nivelesRedComercial: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'Los niveles de socios comerciales son obligatorios' })
      .min(1, 'El mínimo de niveles es 1')
      .max(3, 'El máximo de niveles es 3'),
  ),

  porcentajeComisionOficina: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'El porcentaje de comisión de oficina es obligatorio' })
      .min(0, 'El porcentaje de comisión de oficina no puede ser negativo'),
  ),

  porcentajeComisionSocio: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({ error: 'El porcentaje de comisión por socio comercial es obligatorio' })
      .min(0, 'El porcentaje de comisión por socio comercial no puede ser negativo'),
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

    if (
      value.socioComercialNivel2Id === value.socioComercialNivel3Id &&
      value.socioComercialNivel2Id !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['socioComercialNivel3Id'],
        message:
          'No puede seleccionar el mismo socio comercial en ambos niveles',
      });
    }

    if (
      value.nivelesRedComercial >= 2 &&
      !value.socioComercialNivel2Id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['socioComercialNivel2Id'],
        message: 'Debe seleccionar un socio comercial nivel 2',
      });
    }

    if (
      value.nivelesRedComercial >= 3 &&
      !value.socioComercialNivel3Id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['socioComercialNivel3Id'],
        message: 'Debe seleccionar un socio comercial nivel 3',
      });
    }

    const totalComision =
      value.porcentajeComisionOficina +
      value.porcentajeComisionSocio * value.nivelesRedComercial;

    if (totalComision > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['porcentajeComisionSocio'],
        message: 'La comisión total (oficina + socios) no puede superar el 100%',
      });
    }
  });

export type UpdateOperationFormInput = z.input<typeof updateOperationSchema>;
export type UpdateOperationFormValues = z.output<typeof updateOperationSchema>;