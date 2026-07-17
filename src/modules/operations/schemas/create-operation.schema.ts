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

const paymentTypeSchema = z.enum(['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'CHEQUE'], {
  error: 'El tipo de pago es obligatorio',
});

const paymentSchema = z
  .object({
    monto: z.preprocess(
      parseCurrencyInput,
      z.number({ error: 'El monto del comprobante es obligatorio' }).min(0, {
        error: 'El monto del comprobante no puede ser negativo',
      }),
    ),

    tipoPago: z.union([paymentTypeSchema, z.literal('')]).optional(),
    fechaComprobante: z
      .string()
      .min(1, 'La fecha del comprobante es obligatoria'),

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
          message: 'El tipo de pago es obligatorio',
        });
      }
      if (
        value.tipoPago !== 'EFECTIVO' &&
        (!value.cuentaDestinoId || value.cuentaDestinoId < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaDestinoId'],
          message:
            'La cuenta destino es obligatoria para transferencias, depósitos y cheques',
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

    porcentajeComisionSocioNivel2: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z
        .number()
        .min(0, 'El porcentaje de comisión del socio comercial nivel 2 no puede ser negativo')
        .optional(),
    ),

    porcentajeComisionSocioNivel3: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z
        .number()
        .min(0, 'El porcentaje de comisión del socio comercial nivel 3 no puede ser negativo')
        .optional(),
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

    if (
      value.socioComercialNivel2Id !== undefined &&
      value.socioComercialNivel2Id === value.socioComercialNivel3Id
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
      value.porcentajeComisionSocioNivel2 === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['porcentajeComisionSocioNivel2'],
        message: 'Debe indicar el porcentaje de comisión del socio comercial nivel 2',
      });
    }

    if (
      value.nivelesRedComercial >= 3 &&
      value.porcentajeComisionSocioNivel3 === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['porcentajeComisionSocioNivel3'],
        message: 'Debe indicar el porcentaje de comisión del socio comercial nivel 3',
      });
    }

    const totalComision =
      value.porcentajeComisionOficina +
      value.porcentajeComisionSocio +
      (value.nivelesRedComercial >= 2 ? (value.porcentajeComisionSocioNivel2 ?? 0) : 0) +
      (value.nivelesRedComercial >= 3 ? (value.porcentajeComisionSocioNivel3 ?? 0) : 0);

    if (totalComision > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['porcentajeComisionSocio'],
        message: 'La comisión total (oficina + socios) no puede superar el 100%',
      });
    }
  });

export type CreateOperationFormInput = z.input<typeof createOperationSchema>;
export type CreateOperationFormValues = z.output<typeof createOperationSchema>;