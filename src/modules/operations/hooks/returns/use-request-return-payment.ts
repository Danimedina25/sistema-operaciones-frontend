import { useState } from 'react';
import toast from 'react-hot-toast';

import { requestReturnPayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { RequestReturnFormValues } from '../../components/returns/RequestReturnForm';

interface UseRequestReturnPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}

function cleanText(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function cleanNumbers(value?: string) {
  const cleaned = value?.replace(/\s/g, '').trim();
  return cleaned ? cleaned : undefined;
}

export function useRequestReturnPayment(
  options?: UseRequestReturnPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitRequestReturnPayment = async (
    operationId: number,
    values: RequestReturnFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      let archivoNominaUrl: string | undefined;

      if (values.archivoNomina) {
        if (!user?.userId) {
          throw new Error('No se pudo identificar el usuario autenticado');
        }

        const uploadResult = await uploadOperationProof({
          file: values.archivoNomina,
          userId: user.userId,
          operationId,
          folder: 'nominas',
        });

        archivoNominaUrl = uploadResult.downloadUrl;
      }

      await requestReturnPayment(operationId, {
        pagos: values.pagos.map((pago) => {
          const isCash = pago.tipoPago === 'EFECTIVO';

          return {
            monto: pago.monto,
            tipoPago: pago.tipoPago,
            banco: isCash ? undefined : cleanText(pago.banco),
            titular: isCash ? undefined : cleanText(pago.titular),
            cuenta: isCash ? undefined : cleanNumbers(pago.cuenta),
            clabe: isCash ? undefined : cleanNumbers(pago.clabe),
            observaciones: cleanText(pago.observaciones),
            autorizadoParaRecibirEfectivo1: pago.autorizadoParaRecibirEfectivo1,
            autorizadoParaRecibirEfectivo2: pago.autorizadoParaRecibirEfectivo2,
            autorizadoParaRecibirEfectivo3: pago.autorizadoParaRecibirEfectivo3,
            archivoNominaUrl,
          };
        }),
      });

      toast.success('Solicitud de retorno registrada correctamente');
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
    submitRequestReturnPayment,
  };
}