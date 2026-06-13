import { useState } from 'react';

import toast from 'react-hot-toast';

import {
  getBeneficiaryCommissionDetail,
} from '../api/commercial-partner-commissions.api';

import type {
  BeneficiaryCommissionDetailResponse,
  CommissionBeneficiaryType,
} from '../types/commercial-partner-commissions.types';

import {
  getApiErrorMessage,
} from '@/shared/utils/errors';

type Params = {

  beneficiaryId: number;

  beneficiaryType: CommissionBeneficiaryType;

  startDate: string;

  endDate: string;
};

export function useBeneficiaryCommissionDetail() {

  const [detail, setDetail] =
    useState<BeneficiaryCommissionDetailResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchDetail = async (
    params: Params,
  ) => {

    try {

      setIsLoading(true);

      const response =
        await getBeneficiaryCommissionDetail(
          params,
        );

      setDetail(
        response,
      );

    } catch (error) {

      toast.error(
        getApiErrorMessage(error),
      );

    } finally {

      setIsLoading(false);

    }
  };

  const clearDetail = () => {

    setDetail(null);

  };

  return {
    detail,
    isLoading,
    fetchDetail,
    clearDetail,
  };
}