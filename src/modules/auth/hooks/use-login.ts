import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginRequest } from '@/modules/auth/api/auth.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { paths } from '@/routes/paths';
import type { LoginRequest } from '@/modules/auth/types/auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (values: LoginRequest) => {
    try {
      setIsSubmitting(true);

      const authData = await loginRequest({
        correo: values.correo.trim().toLowerCase(),
        password: values.password,
      });

      login(authData);

      toast.success(`Bienvenido, ${authData.nombre}`);
      navigate(paths.dashboard, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitLogin,
    isSubmitting,
  };
}