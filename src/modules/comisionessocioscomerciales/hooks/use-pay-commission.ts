import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  payCommission,
} from '../api/commercial-partner-commissions.api';

import {
  uploadOperationProof,
} from '@/modules/operations/api/operations-storage.api';

import {
  useAuth,
} from '@/modules/auth/store/auth.context';

import {
  getApiErrorMessage,
} from '@/shared/utils/errors';

export function usePayCommission() {

  const [isLoading, setIsLoading] =
    useState(false);

  const { user } = useAuth();

  const handlePayCommission = async (
    commissionId: number,
    operationId: number,
    comprobante: File,
  ) => {

    try {

      setIsLoading(true);

      if (!user?.userId) {
        throw new Error(
          'No se pudo identificar al usuario'
        );
      }

      const uploadResult =
        await uploadOperationProof({
          file: comprobante,
          userId: user.userId,
          operationId,
        });

      const response =
        await payCommission(
          commissionId,
          {
            paymentProofUrl:
              uploadResult.downloadUrl,
          },
        );

      toast.success(
        'Comisión pagada exitosamente',
      );

      return response;

    } catch (error) {

      toast.error(
        getApiErrorMessage(error),
      );

      throw error;

    } finally {

      setIsLoading(false);

    }
  };

  return {
    isLoading,
    handlePayCommission,
  };
}