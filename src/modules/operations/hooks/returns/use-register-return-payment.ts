// hooks/useRegisterReturnPayment.ts

import { useState } from 'react';
import toast from 'react-hot-toast';

import { registerReturnPayment } from '@/modules/operations/api/operations.api';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';

import { useAuth } from '@/modules/auth/store/auth.context';

import { getApiErrorMessage } from '@/shared/utils/errors';
import { AddReturnPaymentFormValues } from '../../components/AddReturnPaymentForm';


interface UseRegisterReturnPaymentOptions {
  onSuccess?: () => void | Promise<void>;
}


function parseCurrency(value: string) {
  return Number(value.replace(/,/g, ''));
}

export function useRegisterReturnPayment(
  options?: UseRegisterReturnPaymentOptions,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const submitRegisterReturnPayment = async (
    operationId: number,
    values: AddReturnPaymentFormValues,
    ) => {
    try {
        if (!user?.userId) {
        throw new Error('No se pudo identificar el usuario autenticado');
        }

        if (!values.tipoPago) {
        throw new Error('El tipo de retorno es obligatorio');
        }

        setIsSubmitting(true);

        const isCash = values.tipoPago === 'EFECTIVO';

        let comprobanteUrl: string | undefined;

        if (!isCash) {
        const comprobante = values.comprobante?.item(0);

        if (!comprobante) {
            throw new Error('El comprobante es obligatorio');
        }

        const uploadResult = await uploadOperationProof({
            file: comprobante,
            userId: user.userId,
            operationId,
        });

        comprobanteUrl = uploadResult.downloadUrl;
        }

        await registerReturnPayment(operationId, {
        monto: parseCurrency(values.monto),
        tipoPago: values.tipoPago,
        cuentaOrigenId: isCash ? null : Number(values.cuentaOrigenId),
        cuentaDestinoCliente: isCash
        ? null
        : values.cuentaDestinoCliente.replace(/\s/g, ''),
        comprobanteUrl,
        observaciones: values.observaciones?.trim() || undefined,
        });

        toast.success('Retorno registrado correctamente');
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
    submitRegisterReturnPayment,
  };
}