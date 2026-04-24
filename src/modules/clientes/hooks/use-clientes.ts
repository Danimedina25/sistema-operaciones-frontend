import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  activateCliente,
  deactivateCliente,
  getClientes,
} from '@/modules/clientes/api/clientes.api';
import type { ClienteResponse } from '@/modules/clientes/types/clientes.types';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingClienteId, setProcessingClienteId] = useState<number | null>(
    null,
  );

  const fetchClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClientes();
  }, [fetchClientes]);

  const handleActivate = async (clienteId: number) => {
    try {
      setProcessingClienteId(clienteId);
      const updatedCliente = await activateCliente(clienteId);

      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteId ? updatedCliente : cliente,
        ),
      );

      toast.success('Cliente activado correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingClienteId(null);
    }
  };

  const handleDeactivate = async (clienteId: number) => {
    try {
      setProcessingClienteId(clienteId);
      const updatedCliente = await deactivateCliente(clienteId);

      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteId ? updatedCliente : cliente,
        ),
      );

      toast.success('Cliente desactivado correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingClienteId(null);
    }
  };

  return {
    clientes,
    isLoading,
    processingClienteId,
    fetchClientes,
    handleActivate,
    handleDeactivate,
  };
}