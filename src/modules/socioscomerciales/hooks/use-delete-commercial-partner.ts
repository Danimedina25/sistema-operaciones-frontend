import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteCommercialPartner } from '@/modules/socioscomerciales/api/socioscomerciales.api';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeleteCommercialPartnerOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useDeleteCommercialPartner(options?: UseDeleteCommercialPartnerOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const submitDeleteCommercialPartner = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await deleteCommercialPartner(id);

      toast.success('Socio comercial eliminado permanentemente');

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
    submitDeleteCommercialPartner,
  };
}
