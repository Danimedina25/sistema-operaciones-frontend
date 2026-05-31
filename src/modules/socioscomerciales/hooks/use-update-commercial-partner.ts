// src/modules/socioscomerciales/hooks/use-update-commercial-partner.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { updateCommercialPartner } from '@/modules/socioscomerciales/api/socioscomerciales.api';

import type { UpdateCommercialPartnerFormValues } from '@/modules/socioscomerciales/schemas/update-commercial-partner.schema';

import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseUpdateCommercialPartnerOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateCommercialPartner(
  options?: UseUpdateCommercialPartnerOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateCommercialPartner = async (
    id: number,
    values: UpdateCommercialPartnerFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const result = await updateCommercialPartner(id, {
        nombre: values.nombre.trim(),
        cuentaBancaria: values.cuentaBancaria.trim(),
        banco: values.banco.trim(),
        titularCuenta: values.titularCuenta.trim(),
        nivel: values.nivel,
        activo: values.activo,
      });

      toast.success('Socio comercial actualizado exitosamente');

      if (options?.onSuccess) {
        await options.onSuccess();
      }

      return result;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitUpdateCommercialPartner,
  };
}