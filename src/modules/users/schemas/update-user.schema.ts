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

    commissionPercentage: z.preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }

        return Number(value);
      },
      z.number().positive('El porcentaje debe ser mayor a 0').max(100, 'El porcentaje no puede ser mayor a 100').optional(),
    ),

    appliesToNetwork: z.boolean().optional().default(true),
  })
  .superRefine((values, ctx) => {
    if (values.roleName === 'SOCIO_COMERCIAL') {
      if (values.commissionPercentage === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['commissionPercentage'],
          message: 'El porcentaje de comisión es obligatorio para un socio comercial',
        });
      }
    }
  });

export type UpdateUserFormInput = z.input<typeof updateUserSchema>;
export type UpdateUserFormValues = z.output<typeof updateUserSchema>;