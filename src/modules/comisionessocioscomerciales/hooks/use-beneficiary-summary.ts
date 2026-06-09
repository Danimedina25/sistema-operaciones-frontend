import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  getSummaryByBeneficiary,
} from '../api/commercial-partner-commissions.api';

import type {
  CommissionPartnerSummaryListResponse,
} from '../types/commercial-partner-commissions.types';

import {
  getApiErrorMessage,
} from '@/shared/utils/errors';

type DateRange = {
  startDate: string;
  endDate: string;
};

export function useBeneficiarySummary() {

  const [summary, setSummary] =
    useState<CommissionPartnerSummaryListResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchSummary = async (
    params: DateRange,
  ) => {

    try {

      setIsLoading(true);

      const response =
        await getSummaryByBeneficiary(
          params,
        );

      setSummary(response);

    } catch (error) {

      toast.error(
        getApiErrorMessage(error),
      );

    } finally {

      setIsLoading(false);

    }
  };

  return {
    summary,
    isLoading,
    fetchSummary,
  };
}