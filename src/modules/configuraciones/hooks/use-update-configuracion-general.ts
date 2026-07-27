// src/modules/configuraciones/hooks/use-update-configuracion-general.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { updateConfiguracionGeneral } from '@/modules/configuraciones/api/configuraciones.api';
import type { UpdateConfiguracionGeneralFormValues } from '@/modules/configuraciones/schemas/update-configuracion-general.schema';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseUpdateConfiguracionGeneralOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateConfiguracionGeneral(
  options?: UseUpdateConfiguracionGeneralOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateConfiguracionGeneral = async (
    values: UpdateConfiguracionGeneralFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const result = await updateConfiguracionGeneral({
        porcentajeComisionOficina: values.porcentajeComisionOficina,
      });

      toast.success('Configuración actualizada exitosamente');

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
    submitUpdateConfiguracionGeneral,
  };
}
