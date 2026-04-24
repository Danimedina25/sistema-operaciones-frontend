import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateCliente } from '@/modules/clientes/api/clientes.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { UpdateClienteFormValues } from '@/modules/clientes/schemas/update-cliente.schema';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';

interface UseUpdateClienteOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useUpdateCliente(options?: UseUpdateClienteOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitUpdateCliente = async (
    cliente: ClienteResponse,
    values: UpdateClienteFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      const updatedCliente = await updateCliente(cliente.id, {
        nombre: values.nombre.trim(),
        activo: values.activo,
        nivelesRedComercial: values.nivelesRedComercial,
        porcentajeComisionAplicado: values.porcentajeComisionAplicado,
      });

      toast.success(`Cliente ${updatedCliente.nombre} actualizado correctamente`);

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
    submitUpdateCliente,
  };
}