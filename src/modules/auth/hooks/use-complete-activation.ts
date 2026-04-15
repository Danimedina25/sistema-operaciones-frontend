import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { completeActivation } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { paths } from '@/routes/paths';

export function useCompleteActivation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitActivation = async (token: string, password: string) => {
    alert(token)
    try {
      setIsSubmitting(true);

      await completeActivation({
        token,
        password,
      });

      toast.success('Cuenta activada correctamente');
      navigate(paths.login, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitActivation,
    isSubmitting,
  };
}