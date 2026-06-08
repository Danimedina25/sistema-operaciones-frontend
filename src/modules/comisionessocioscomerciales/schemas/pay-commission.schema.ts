import { z } from 'zod';

export const payCommissionSchema =
  z.object({
    paymentProofUrl: z
      .string()
      .url('Debe proporcionar una URL válida'),
  });

export type PayCommissionFormInput =
  z.input<typeof payCommissionSchema>;

export type PayCommissionFormValues =
  z.output<typeof payCommissionSchema>;