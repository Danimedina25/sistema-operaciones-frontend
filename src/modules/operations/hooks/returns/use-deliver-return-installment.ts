import { useState } from 'react';
import toast from 'react-hot-toast';

import { deliverReturnInstallment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface Options {
  onSuccess?: () => void | Promise<void>;
}

export function useDeliverReturnInstallment(options?: Options) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitDeliverReturnInstallment = async (
    installmentId: number,
    operationId: number,
    comprobanteEntrega: File,
    personaQueRecibioEfectivo: string,
  ) => {
    try {
      if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
      }
      if (!comprobanteEntrega.type.startsWith('image/')) {
        throw new Error('El comprobante de entrega debe ser una imagen');
      }
      // El receptor debe ser válido antes de subir la foto: no se sube nada si
      // no hay persona autorizada seleccionada.
      const persona = personaQueRecibioEfectivo.trim();
      if (!persona) {
        throw new Error('Selecciona la persona autorizada que recibió los fondos');
      }

      setIsSubmitting(true);

      const uploadResult = await uploadOperationProof({
        file: comprobanteEntrega,
        userId: user.userId,
        operationId,
        folder: 'comprobantes-entrega-efectivo',
      });

      await deliverReturnInstallment(installmentId, {
        comprobanteEntregaUrl: uploadResult.downloadUrl,
        personaQueRecibioEfectivo: persona,
      });

      toast.success('Parcialidad cerrada correctamente');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitDeliverReturnInstallment };
}
