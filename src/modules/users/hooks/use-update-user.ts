import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateUser } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { UpdateUserFormValues } from '@/modules/users/schemas/update-user.schema';
import type { UserResponse } from '@/modules/users/types/users.types';

interface UseUpdateUserOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateUser(options?: UseUpdateUserOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateUser = async (
    user: UserResponse,
    values: UpdateUserFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const isSocioComercial =
        values.roleName === 'SOCIO_COMERCIAL';

      const updatedUser = await updateUser(user.id, {
        nombre: values.nombre.trim(),
        roleId: values.roleId,
        activo: values.activo,

        appliesToNetwork: isSocioComercial
          ? values.appliesToNetwork
          : undefined,

        cuentaBancaria: isSocioComercial
          ? values.cuentaBancaria?.trim() || undefined
          : undefined,

        banco: isSocioComercial
          ? values.banco?.trim() || undefined
          : undefined,

        titularCuenta: isSocioComercial
          ? values.titularCuenta?.trim() || undefined
          : undefined,
      });

      toast.success(
        `Usuario ${updatedUser.nombre} actualizado correctamente`,
      );

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
    submitUpdateUser,
  };
}