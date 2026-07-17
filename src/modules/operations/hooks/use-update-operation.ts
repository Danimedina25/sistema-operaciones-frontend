import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateOperation } from '@/modules/operations/api/operations.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { UpdateOperationFormValues } from '@/modules/operations/schemas/update-operation.schema';

interface UseUpdateOperationOptions {
  onSuccess?: (operationId: number) => void | Promise<void>;
}

export function useUpdateOperation(options?: UseUpdateOperationOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitUpdateOperation = async (
    operationId: number,
    values: UpdateOperationFormValues,
) => {
    try {
        if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
        }

        setIsSubmitting(true);

        const operation = await updateOperation(operationId, {
            clienteId: values.clienteId,
            montoTotal: values.montoTotal,
            socioComercialId: user.userId,
            socioComercialNivel2Id: values.socioComercialNivel2Id,
            socioComercialNivel3Id: values.socioComercialNivel3Id,
            nivelesRedComercial: values.nivelesRedComercial,
            porcentajeComisionOficina: values.porcentajeComisionOficina,
            porcentajeComisionSocio: values.porcentajeComisionSocio,
            porcentajeComisionSocioNivel2:
              values.nivelesRedComercial >= 2 ? values.porcentajeComisionSocioNivel2 : undefined,
            porcentajeComisionSocioNivel3:
              values.nivelesRedComercial >= 3 ? values.porcentajeComisionSocioNivel3 : undefined,
            observaciones: values.observaciones?.trim() || undefined,
        });

        toast.success('Operación actualizada correctamente');
        await options?.onSuccess?.(operation.id);
    } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
    } finally {
        setIsSubmitting(false);
    }
    };

  return {
    isSubmitting,
    submitUpdateOperation,
  };
}