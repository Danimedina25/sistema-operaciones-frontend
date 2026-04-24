import { useState } from 'react';
import toast from 'react-hot-toast';
import { createCliente } from '@/modules/clientes/api/clientes.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { CreateClienteFormValues } from '@/modules/clientes/schemas/create-cliente.schema';

interface UseCreateClienteOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateCliente(options?: UseCreateClienteOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCreateCliente = async (values: CreateClienteFormValues) => {
    try {
      setIsSubmitting(true);

      const cliente = await createCliente({
        nombre: values.nombre.trim(),
        nivelesRedComercial: values.nivelesRedComercial,
        porcentajeComisionAplicado: values.porcentajeComisionAplicado,
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