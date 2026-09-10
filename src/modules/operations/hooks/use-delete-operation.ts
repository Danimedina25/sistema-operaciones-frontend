import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteOperation } from '@/modules/operations/api/operations.api';
import { deleteOperationProofByUrl } from '@/modules/operations/api/operations-storage.api';
import { PaymentOperationResponse } from '@/modules/operations/types/operations.types.ts';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UseDeleteOperationOptions {
  onSuccess?: (operation: PaymentOperationResponse) => void | Promise<void>;
  onRejected?: (operation: PaymentOperationResponse) => void | Promise<void>;
}

function collectProofUrls(operation: PaymentOperationResponse): string[] {
  return operation.pagos.flatMap((pago) =>
    [pago.comprobanteUrl, pago.comprobanteValidacionUrl].filter(
      (url): url is string => Boolean(url),
    ),
  );
}

export function useDeleteOperation(options?: UseDeleteOperationOptions) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const submitDeleteOperation = async (
    operation: PaymentOperationResponse,
  ): Promise<boolean> => {
    // Segunda barrera contra envíos duplicados: el botón ya queda deshabilitado,
    // pero un doble clic rápido puede colarse antes del re-render.
    if (isDeleting) return false;

    try {
      setIsDeleting(true);

      await deleteOperation(operation.id);

      // Los archivos solo se tocan cuando la base de datos ya confirmó el borrado.
      await cleanUpProofs(operation);

      toast.success('Operación eliminada permanentemente');

      // register-work-refresh ya invalida listados y colas en cualquier DELETE
      // sobre /operations; estos dashboards quedan fuera de esa lista.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['late-returns'] }),
        queryClient.invalidateQueries({ queryKey: ['stalled-operations'] }),
      ]);

      await options?.onSuccess?.(operation);
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));

      // El rechazo típico es que el estatus cambió mientras el modal estaba
      // abierto: hay que releer la operación para dejar de mostrar datos viejos.
      await options?.onRejected?.(operation);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { isDeleting, submitDeleteOperation };
}

/**
 * La limpieza del almacenamiento no puede revertir el borrado ya confirmado: si
 * falla, se avisa y se deja rastro suficiente para eliminar el huérfano después.
 */
async function cleanUpProofs(operation: PaymentOperationResponse) {
  const urls = collectProofUrls(operation);
  if (urls.length === 0) return;

  const results = await Promise.allSettled(urls.map(deleteOperationProofByUrl));
  const failed = urls.filter((_, index) => results[index].status === 'rejected');

  if (failed.length === 0) return;

  toast.error(
    `La operación se eliminó, pero no se pudieron borrar ${failed.length} archivo(s) de almacenamiento`,
  );
  console.error(
    `[operaciones] archivos huérfanos tras eliminar la operación #${operation.id}:`,
    failed,
  );
}
