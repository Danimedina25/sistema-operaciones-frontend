import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteUser } from '@/modules/users/api/users.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeleteUserOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useDeleteUser(options?: UseDeleteUserOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const submitDeleteUser = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await deleteUser(id);

      toast.success('Usuario eliminado permanentemente');

      if (options?.onSuccess) {
        await options.onSuccess();
      }

      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    submitDeleteUser,
  };
}
