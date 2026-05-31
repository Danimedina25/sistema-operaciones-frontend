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

interface ValidatedPayment {
  monto: number;
  tipoPago: PaymentType;
  cuentaDestinoId?: number;
  comprobante: File;
  observaciones?: string;
}

export function useCreateOperation(options?: UseCreateOperationOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitCreateOperation = async (
    values: CreateOperationFormValues,
  ) => {
    try {
      if (!user?.userId) {
        toast.error('No se pudo identificar el usuario autenticado');
        return;
      }

      /**
       * VALIDAR TODO ANTES DE LLAMAR APIS
       */
      const pagosValidados: ValidatedPayment[] = [];

      for (const pago of values.pagos) {
        if (pago.monto <= 0) continue;

        const comprobante =
          pago.comprobante instanceof File
            ? pago.comprobante
            : pago.comprobante instanceof FileList
              ? pago.comprobante.item(0)
              : null;

        if (!comprobante) {
          toast.error(
            'Falta el comprobante de uno de los pagos con monto mayor a cero',
          );
          return;
        }

        if (!pago.tipoPago) {
          toast.error(
            'Falta el tipo de pago en uno de los pagos con monto mayor a cero',
          );
          return;
        }

        if (
          pago.tipoPago !== 'EFECTIVO' &&
          !pago.cuentaDestinoId
        ) {
          toast.error(
            'Falta la cuenta destino en uno de los pagos con monto mayor a cero',
          );
          return;
        }

        pagosValidados.push({
          monto: pago.monto,
          tipoPago: pago.tipoPago as PaymentType,
          cuentaDestinoId: pago.cuentaDestinoId,
          comprobante, // aquí ya es File
          observaciones: pago.observaciones?.trim() || undefined,
        });
      }

      setIsSubmitting(true);

      /**
       * CREAR OPERACIÓN
       */
      const operation = await createOperation({
        clienteId: values.clienteId,
        montoTotal: values.montoTotal,
        socioComercialId: user.userId,
        socioComercialNivel2Id: values.socioComercialNivel2Id,
        socioComercialNivel3Id: values.socioComercialNivel3Id,
        observaciones: values.observaciones?.trim() || undefined,
      });

      /**
       * REGISTRAR PAGOS
       */
      for (const pago of pagosValidados) {
        const uploadResult = await uploadOperationProof({
          file: pago.comprobante,
          userId: user.userId,
          operationId: operation.id,
        });

        await addOperationPayment({
          operacionId: operation.id,
          monto: pago.monto,
          tipoPago: pago.tipoPago,
          cuentaDestinoId: pago.cuentaDestinoId,
          comprobanteUrl: uploadResult.downloadUrl,
          observaciones: pago.observaciones,
        });
      }

      toast.success('Operación creada correctamente');

      await options?.onSuccess?.(operation.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitCreateOperation,
  };
}