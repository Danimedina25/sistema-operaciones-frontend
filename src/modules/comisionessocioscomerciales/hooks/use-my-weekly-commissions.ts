import { useCallback, useState } from 'react';

import toast from 'react-hot-toast';

import {
  getMyWeeklyCommissions,
} from '../api/commercial-partner-commissions.api';

import type {
  MyWeeklyCommissionsResponse,
} from '../types/commercial-partner-commissions.types';

import {
  getApiErrorMessage,
} from '@/shared/utils/errors';

type Params = {

  startDate: string;

  endDate: string;
};

export function useMyWeeklyCommissions() {

  const [commissions, setCommissions] =
    useState<MyWeeklyCommissionsResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = useCallback(async (
    params: Params,
  ) => {

    try {

      setIsLoading(true);
      setError(null);

      const response =
        await getMyWeeklyCommissions(
          params,
        );

      setCommissions(
        response,
      );

    } catch (error) {

      const message = getApiErrorMessage(error);
      setCommissions(null);
      setError(message);
      toast.error(message);

    } finally {

      setIsLoading(false);

    }
  }, []);

  const clearCommissions = () => {

    setCommissions(
      null,
    );

  };

  return {
    commissions,
    isLoading,
    error,
    fetchCommissions,
    clearCommissions,
  };
}
