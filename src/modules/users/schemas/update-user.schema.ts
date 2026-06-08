import { z } from 'zod';

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

    cuentaBancaria: z
      .string()
      .trim()
      .regex(
        /^\d{18}$/,
        'La CLABE interbancaria debe contener exactamente 18 dígitos',
      )
      .optional(),

    banco: z
      .string()
      .max(
        100,
        'El banco no puede exceder 100 caracteres',
      )
      .optional(),

    titularCuenta: z
      .string()
      .max(
        150,
        'El titular de la cuenta no puede exceder 150 caracteres',
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.roleName === 'SOCIO_COMERCIAL') {
      if (!values.cuentaBancaria?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaBancaria'],
          message:
            'La cuenta bancaria es obligatoria para un socio comercial',
        });
      }

      if (!values.banco?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['banco'],
          message:
            'El banco es obligatorio para un socio comercial',
        });
      }

      if (!values.titularCuenta?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['titularCuenta'],
          message:
            'El titular de la cuenta es obligatorio para un socio comercial',
        });
      }
    }
  });

export type UpdateUserFormInput = z.input<typeof updateUserSchema>;
export type UpdateUserFormValues = z.output<typeof updateUserSchema>;