import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  getOperationDetail,
  getOperationBeneficiaries,
} from '../api/commercial-partner-commissions.api';

import type {
  CommissionOperationDetailResponse,
  CommissionBeneficiaryResponse,
} from '../types/commercial-partner-commissions.types';

import { getApiErrorMessage } from '@/shared/utils/errors';

export function useOperationDetail() {
  const [detail, setDetail] =
    useState<CommissionOperationDetailResponse | null>(
      null,
    );

  const [beneficiaries, setBeneficiaries] =
    useState<CommissionBeneficiaryResponse[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchOperationDetail = async (
    operationId: number,
  ) => {
    try {
      setIsLoading(true);

      const response =
        await getOperationDetail(
          operationId,
        );

      setDetail(response);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBeneficiaries = async (
    operationId: number,
  ) => {
    try {
      const response =
        await getOperationBeneficiaries(
          operationId,
        );

      setBeneficiaries(response);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    }
  };

  return {
    detail,
    beneficiaries,
    isLoading,
    fetchOperationDetail,
    fetchBeneficiaries,
  };
}