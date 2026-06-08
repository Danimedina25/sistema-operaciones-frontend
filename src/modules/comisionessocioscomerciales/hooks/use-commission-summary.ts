import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  getSummary,
  getPendingCommissions,
  getPaidCommissions,
} from '../api/commercial-partner-commissions.api';

import type {
  CommissionSummaryResponse,
} from '../types/commercial-partner-commissions.types';

import { getApiErrorMessage } from '@/shared/utils/errors';

type DateRange = {
  startDate: string;
  endDate: string;
};

export function useCommissionSummary() {
  const [summary, setSummary] =
    useState<CommissionSummaryResponse | null>(
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
        await getSummary(params);

      setSummary(response);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPending = async (
    params: DateRange,
  ) => {
    try {
      setIsLoading(true);

      const response =
        await getPendingCommissions(params);

      setSummary(response);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaid = async (
    params: DateRange,
  ) => {
    try {
      setIsLoading(true);

      const response =
        await getPaidCommissions(params);

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
    fetchPending,
    fetchPaid,
  };
}