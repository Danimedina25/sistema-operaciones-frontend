import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

export const updateUserSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(150, 'El nombre no puede exceder 150 caracteres'),

    roleId: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z.number({ error: 'El rol es obligatorio' }).min(1, {
        error: 'El rol es obligatorio',
      }),
    ),

    roleName: z.string().optional(),

    activo: z.boolean().optional(),

    appliesToNetwork: z.boolean().optional().default(true),

    cuentaBancaria: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .regex(
          /^\d{18}$/,
          'La CLABE interbancaria debe contener exactamente 18 dígitos',
        )
        .optional(),
    ),

    banco: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .max(100, 'El banco no puede exceder 100 caracteres')
        .optional(),
    ),

    titularCuenta: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .max(150, 'El titular de la cuenta no puede exceder 150 caracteres')
        .optional(),
    ),
  })
  .superRefine((values, ctx) => {
    const requiresBankData =
      values.roleName === 'SOCIO_COMERCIAL' || values.roleName === 'ADMIN';

    if (!requiresBankData) {
      return;
    }

    if (!values.cuentaBancaria) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cuentaBancaria'],
        message: 'La CLABE interbancaria es obligatoria',
      });
    }

    if (!values.banco) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['banco'],
        message: 'El banco es obligatorio',
      });
    }

    if (!values.titularCuenta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['titularCuenta'],
        message: 'El titular de la cuenta es obligatorio',
      });
    }
  });

export type UpdateUserFormInput = z.input<typeof updateUserSchema>;
export type UpdateUserFormValues = z.output<typeof updateUserSchema>;