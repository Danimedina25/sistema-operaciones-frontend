import { useState } from 'react';
import toast from 'react-hot-toast';
import { createUser } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { CreateUserFormValues } from '@/modules/users/schemas/create-user.schema';

interface UseCreateUserOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateUser(options?: UseCreateUserOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCreateUser = async (values: CreateUserFormValues) => {
    try {
      setIsSubmitting(true);

      const isSocioComercial = values.roleName === 'SOCIO_COMERCIAL';

      const result = await createUser({
        nombre: values.nombre.trim(),
        correo: values.correo.trim().toLowerCase(),
        roleId: values.roleId,
        commissionPercentage: isSocioComercial
          ? values.commissionPercentage
          : undefined,
        appliesToNetwork: isSocioComercial
          ? values.appliesToNetwork
          : undefined,
      });

      toast.success(result.message);

      if (options?.onSuccess) {
        await options.onSuccess();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitCreateUser,
  };
}