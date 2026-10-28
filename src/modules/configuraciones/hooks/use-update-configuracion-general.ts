// src/modules/configuraciones/hooks/use-update-configuracion-general.ts

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const client = useQueryClient();

  const submitUpdateConfiguracionGeneral = async (
    values: UpdateConfiguracionGeneralFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const result = await updateConfiguracionGeneral({
        porcentajeComisionOficina: values.porcentajeComisionOficina,
        horasPendienteAtencion: values.horasPendienteAtencion,
        horasPendienteUrgente: values.horasPendienteUrgente,
      });

      toast.success('Configuración actualizada exitosamente');
      // El semáforo de pendientes de todos los perfiles usa estos umbrales.
      await client.invalidateQueries({ queryKey: ['configuraciones', 'pendientes'] });

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
