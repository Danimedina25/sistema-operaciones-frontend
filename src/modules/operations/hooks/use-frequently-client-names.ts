import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getFrequentClientNames } from '@/modules/operations/api/operations.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useFrequentClientNames() {
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const result = await getFrequentClientNames();
        setClientNames(result);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return {
    clientNames,
    isLoading,
  };
}