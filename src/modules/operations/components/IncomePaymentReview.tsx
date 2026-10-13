import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryState } from '@/shared/components/ui/QueryState';
import { getOperationById } from '../api/operations.api';
import { useValidatePayment } from '../hooks/use-validate-payment';
import { useRejectPayment } from '../hooks/use-reject-payment';
import { useMarkPaymentInProgress } from '../hooks/use-mark-payment-in-progress';
import { PaymentsTable } from './PaymentsTable';

export function IncomePaymentReview({ operationId, paymentId, workQueryKey, onClose }: {
  operationId: number; paymentId: number; workQueryKey: 'cash-work' | 'bank-work'; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const operation = useQuery({ queryKey: ['operation', operationId], queryFn: () => getOperationById(operationId) });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: [workQueryKey] }); };
  const validation = useValidatePayment({ onSuccess: refresh });
  const rejection = useRejectPayment({ onSuccess: refresh });
  const progress = useMarkPaymentInProgress({ onSuccess: refresh });
  return <QueryState isLoading={operation.isPending} error={operation.error} onRetry={() => void operation.refetch()} loadingLabel="Abriendo pago…">
    {operation.data && <PaymentsTable reviewOnly payments={operation.data.pagos} operationId={operationId}
      clienteNombre={operation.data.clienteNombre} socioComercialNombre={operation.data.socioComercialNombre}
      initialReviewPaymentId={paymentId} onInitialReviewHandled={onClose}
      processingPaymentId={validation.processingPaymentId ?? rejection.processingPaymentId ?? progress.processingPaymentId}
      onValidatePayment={(id, receipt, counts) => validation.submitValidatePayment(operationId, id, receipt, counts)}
      onRejectPayment={(id, reason) => rejection.submitRejectPayment(id, reason)}
      onMarkPaymentInProgress={progress.submitMarkInProgress} onReleasePayment={progress.submitRelease} />}
  </QueryState>;
}
