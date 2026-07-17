import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteCliente } from '@/modules/clientes/api/clientes.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeleteClienteOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useDeleteCliente(options?: UseDeleteClienteOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const submitDeleteCliente = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await deleteCliente(id);

      toast.success('Cliente eliminado permanentemente');

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
    submitDeleteCliente,
  };
}
