import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  getCommissionById,
} from '../api/commercial-partner-commissions.api';

import type {
  CommercialPartnerCommissionResponse,
} from '../types/commercial-partner-commissions.types';

import { getApiErrorMessage } from '@/shared/utils/errors';

export function useCommissionDetail() {
  const [commission, setCommission] =
    useState<CommercialPartnerCommissionResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchCommission = async (
    commissionId: number,
  ) => {
    try {
      setIsLoading(true);

      const response =
        await getCommissionById(
          commissionId,
        );

      setCommission(response);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    commission,
    isLoading,
    fetchCommission,
  };
}