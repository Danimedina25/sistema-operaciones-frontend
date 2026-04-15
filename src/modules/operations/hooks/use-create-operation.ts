import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  addOperationPayment,
  createOperation,
} from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { CreateOperationFormValues } from '@/modules/operations/schemas/create-operation.schema';
import { PaymentType } from '../types/operations.types.ts';

interface UseCreateOperationOptions {
  onSuccess?: (operationId: number) => void | Promise<void>;
}

export function useCreateOperation(options?: UseCreateOperationOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitCreateOperation = async (values: CreateOperationFormValues) => {
    try {
      if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
      }

      setIsSubmitting(true);

      const operation = await createOperation({
        clienteNombre: values.clienteNombre.trim(),
        montoTotal: values.montoTotal,
        socioComercialId: user.userId,
        nivelesRedComercial: values.nivelesRedComercial,
        observaciones: values.observaciones?.trim() || undefined,
      });

      for (const pago of values.pagos) {
        if (pago.monto <= 0) {
          continue;
        }

        const comprobante =
          pago.comprobante instanceof File
            ? pago.comprobante
            : pago.comprobante instanceof FileList
              ? pago.comprobante.item(0)
              : null;

        if (!comprobante) {
          throw new Error(
            'Falta el comprobante de uno de los pagos con monto mayor a cero',
          );
        }

        if (!pago.tipoPago) {
          throw new Error(
            'Falta el tipo de pago en uno de los pagos con monto mayor a cero',
          );
        }

        if (!pago.cuentaDestinoId) {
          throw new Error(
            'Falta la cuenta destino en uno de los pagos con monto mayor a cero',
          );
        }

        const uploadResult = await uploadOperationProof({
          file: comprobante,
          userId: user.userId,
          operationId: operation.id,
        });

        await addOperationPayment({
          operacionId: operation.id,
          monto: pago.monto,
          tipoPago: pago.tipoPago as PaymentType,
          cuentaDestinoId: pago.cuentaDestinoId,
          comprobanteUrl: uploadResult.downloadUrl,
          observaciones: pago.observaciones?.trim() || undefined,
        });
      }

      toast.success('Operación creada correctamente');
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
    submitCreateOperation,
  };
}