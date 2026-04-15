import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateUserEmailAndResend } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { UserResponse } from '@/modules/users/types/users.types';
import type { UpdateUserEmailFormValues } from '@/modules/users/schemas/update-user-email.schema';

interface UseUpdateUserEmailOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateUserEmail(options?: UseUpdateUserEmailOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateUserEmail = async (
    user: UserResponse,
    values: UpdateUserEmailFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      await updateUserEmailAndResend(user.id, {
        correo: values.correo.trim().toLowerCase(),
      });

      toast.success('Correo actualizado correctamente');
      await options?.onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitUpdateUserEmail,
  };
}