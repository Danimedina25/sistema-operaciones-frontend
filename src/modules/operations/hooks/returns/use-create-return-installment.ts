import { useState } from 'react';
import toast from 'react-hot-toast';

import { createReturnInstallment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';

export interface RegisterInstallmentValues {
  operationId: number;
  /** Importe capturado como texto en el formulario. */
  monto: string;
  /** transferencia / retiro sin tarjeta */
  cuentaOrigenId?: string;
  /** transferencia / depósito / cheque */
  comprobante?: FileList;
  /** efectivo / retiro sin tarjeta: evidencia del importe ya preparado */
  evidenciaImportePreparado?: FileList;
  /** efectivo / retiro sin tarjeta */
  fechaRecoleccion?: string;
  horaRecoleccion?: string;
  /** retiro sin tarjeta */
  codigoRetiroSinTarjeta?: string;
  observaciones?: string;
}

interface Options {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateReturnInstallment(options?: Options) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitCreateReturnInstallment = async (
    returnRequestId: number,
    values: RegisterInstallmentValues,
  ) => {
    try {
      setIsSubmitting(true);

      let comprobanteUrl: string | undefined;
      const comprobante = values.comprobante?.item(0);

      if (comprobante) {
        if (!user?.userId) {
          throw new Error('No se pudo identificar el usuario autenticado');
        }

        const uploadResult = await uploadOperationProof({
          file: comprobante,
          userId: user.userId,
          operationId: values.operationId,
        });

        comprobanteUrl = uploadResult.downloadUrl;
      }

      let evidenciaImportePreparadoUrl: string | undefined;
      const evidenciaImportePreparado = values.evidenciaImportePreparado?.item(0);

      if (evidenciaImportePreparado) {
        if (!user?.userId) {
          throw new Error('No se pudo identificar el usuario autenticado');
        }

        const uploadResult = await uploadOperationProof({
          file: evidenciaImportePreparado,
          userId: user.userId,
          operationId: values.operationId,
        });

        evidenciaImportePreparadoUrl = uploadResult.downloadUrl;
      }

      const fechaHoraRecoleccion =
        values.fechaRecoleccion && values.horaRecoleccion
          ? `${values.fechaRecoleccion}T${values.horaRecoleccion}:00`
          : undefined;

      const monto = Number(String(values.monto).replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(monto) || monto <= 0) {
        throw new Error('El importe de la parcialidad no es válido');
      }

      await createReturnInstallment(returnRequestId, {
        monto,
        cuentaOrigenId: values.cuentaOrigenId
          ? Number(values.cuentaOrigenId)
          : undefined,
        comprobanteUrl,
        evidenciaImportePreparadoUrl,
        fechaHoraRecoleccion,
        codigoRetiroSinTarjeta:
          values.codigoRetiroSinTarjeta?.trim() || undefined,
        observaciones: values.observaciones?.trim() || undefined,
      });

      toast.success('Parcialidad registrada correctamente');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitCreateReturnInstallment };
}
