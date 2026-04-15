import { useState } from 'react';
import { completeEmailVerification } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useCompleteEmailVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyEmail = async (token: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      await completeEmailVerification(token);

      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    verifyEmail,
    isLoading,
    isSuccess,
    errorMessage,
  };
}