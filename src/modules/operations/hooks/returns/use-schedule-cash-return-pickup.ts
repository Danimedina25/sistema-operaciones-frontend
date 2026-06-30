// hooks/returns/use-schedule-cash-return-pickup.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { scheduleCashReturnPickup } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

export interface ScheduleCashReturnPickupValues {
  operationId?: number;
  fechaRecoleccionEfectivo: string;
  horaRecoleccionEfectivo: string;
  observaciones?: string;
}

interface UseScheduleCashReturnPickupOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useScheduleCashReturnPickup(
  options?: UseScheduleCashReturnPickupOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitScheduleCashReturnPickup = async (
    returnPaymentId: number,
    values: ScheduleCashReturnPickupValues,
  ) => {
    try {
      if (!values.fechaRecoleccionEfectivo || !values.horaRecoleccionEfectivo) {
        throw new Error('La fecha y hora de recolección son obligatorias');
      }

      setIsSubmitting(true);

      const fechaHoraRecoleccionEfectivo =
        `${values.fechaRecoleccionEfectivo}T${values.horaRecoleccionEfectivo}:00`;

      await scheduleCashReturnPickup(returnPaymentId, {
        fechaHoraRecoleccionEfectivo,
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Fecha y hora de recolección registrada correctamente');

      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitScheduleCashReturnPickup,
  };
}