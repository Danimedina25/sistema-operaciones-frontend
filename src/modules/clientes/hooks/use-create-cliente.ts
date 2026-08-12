import { useState } from 'react';
import toast from 'react-hot-toast';
import { createCliente } from '@/modules/clientes/api/clientes.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { CreateClienteFormValues } from '@/modules/clientes/schemas/create-cliente.schema';
import { useAuth } from '@/modules/auth/store/auth.context';

interface UseCreateClienteOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateCliente(options?: UseCreateClienteOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, hasRole } = useAuth();

  const submitCreateCliente = async (values: CreateClienteFormValues) => {
    try {
      setIsSubmitting(true);

      const canAssignOwner = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);
      const ownerUserId = canAssignOwner ? values.userId : user?.userId;

      if (!ownerUserId) {
        throw new Error('No se pudo identificar al socio comercial nivel 1');
      }

      const cliente = await createCliente({
        userId: ownerUserId,
        nombre: values.nombre.trim(),
        nivelesRedComercial: 1,
      });

      toast.success(`Cliente ${cliente.nombre} creado correctamente`);

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
    submitCreateCliente,
  };
}
