// src/modules/socioscomerciales/hooks/use-create-commercial-partner.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { createCommercialPartner } from '@/modules/socioscomerciales/api/socioscomerciales.api';



import { getApiErrorMessage } from '@/shared/utils/errors';
import { CreateCommercialPartnerFormValues } from '../schemas/create-commercial-partner.schema';

interface UseCreateCommercialPartnerOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateCommercialPartner(
  options?: UseCreateCommercialPartnerOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCreateCommercialPartner = async (
    values: CreateCommercialPartnerFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const result = await createCommercialPartner({
        nombre: values.nombre.trim(),
        cuentaBancaria: values.cuentaBancaria.trim(),
        banco: values.banco.trim(),
        titularCuenta: values.titularCuenta.trim(),
        nivel: values.nivel,
        activo: values.activo,
      });

      toast.success('Socio comercial creado exitosamente');

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
    submitCreateCommercialPartner,
  };
}