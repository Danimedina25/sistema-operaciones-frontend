import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { paths } from '@/routes/paths';
import { Modal } from '@/shared/components/ui/Modal';
import { OperationDetailContainer } from '../components/OperationDetailContainer';
import { AddOperationPaymentForm } from '../components/AddOperationPaymentForm';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useAddOperationPayment } from '../hooks/use-add-operation-payment';
import {
  OperationPaymentResponse,
  PaymentOperationResponse,
  ReturnInstallment,
  ReturnPaymentResponse,
} from '../types/operations.types.ts';
import { useUpdateOperationPayment } from '../hooks/use-update-operation-payment';
import { UpdateOperationPaymentForm } from '../components/UpdateOperationPaymentForm';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useRequestReturnPayment } from '../hooks/returns/use-request-return-payment';
import { RequestReturnModal } from '../components/returns/RequestReturnModal';
import { EditReturnPaymentForm } from '../components/returns/EditReturnPaymentForm';
import { useUpdateRequestReturnPayment } from '../hooks/returns/use-update-request-return-payment';
import { RegisterInstallmentModal } from '../components/returns/RegisterInstallmentModal';
import { InstallmentHistoryModal } from '../components/returns/InstallmentHistoryModal';
import { MarkCashReturnDeliveredModal } from '../components/returns/MarkCashReturnDeliveredModal';
import { useCreateReturnInstallment } from '../hooks/returns/use-create-return-installment';
import { useConfirmReturnInstallment } from '../hooks/returns/use-confirm-return-installment';
import { useDeliverReturnInstallment } from '../hooks/returns/use-deliver-return-installment';
import { useCancelReturnInstallment } from '../hooks/returns/use-cancel-return-installment';
import { useReturnRequestSummary } from '../hooks/returns/use-return-request-summary';
import {
  installmentToCashDeliveryTarget,
  isCashReturnMethod,
} from '../utils/return-installment';
import { formatCurrency } from '../utils/operation-formatters';

export default function OperationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(location.search);

  const scrollToPayments =
    Boolean(location.state?.scrollToPayments) ||
    searchParams.get('scrollToPayments') === 'true';

  const scrollToReturns =
    Boolean(location.state?.scrollToReturns) ||
    searchParams.get('scrollToReturns') === 'true';
  const isReturnsForRequestDetail = location.pathname.startsWith(paths.returnsforrequest);
  const isReturnPaymentDetail = location.pathname.startsWith(paths.returnsforpayment);
  const isReturnsRequestedDetail = location.pathname.startsWith(paths.returnsRequested);

  let backLabel = 'Operaciones';
  if (isReturnsForRequestDetail) backLabel = 'Retornos por solicitar';
  else if (isReturnsRequestedDetail) backLabel = 'Retornos solicitados';
  else if (isReturnPaymentDetail) backLabel = 'Retornos por pagar';

  const { operationId } = useParams<{ operationId: string }>();
  const parsedOperationId = Number(operationId);
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<PaymentOperationResponse | null>(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<OperationPaymentResponse | null>(null);

  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [selectedReturnOperation, setSelectedReturnOperation] =
    useState<PaymentOperationResponse | null>(null);

  const [isEditReturnModalOpen, setIsEditReturnModalOpen] = useState(false);
  const [selectedReturnToEdit, setSelectedReturnToEdit] =
    useState<ReturnPaymentResponse | null>(null);

  const [installmentRequest, setInstallmentRequest] =
    useState<ReturnPaymentResponse | null>(null);
  const [historyRequest, setHistoryRequest] =
    useState<ReturnPaymentResponse | null>(null);
  const [deliverTarget, setDeliverTarget] = useState<ReturnInstallment | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ReturnInstallment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReturnInstallment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  const canRequestReturn = roles.some(
    (role) => role === 'SOCIO_COMERCIAL' || role === 'ADMIN',
  );

  const {
    accounts: bankAccountsCatalog,
    isLoading: isLoadingBankAccounts,
  } = useBankAccounts();

  const bankAccounts = useMemo(
    () =>
      bankAccountsCatalog
        .filter((account) => account.activo)
        .map((account) => ({
          id: account.id,
          label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
        })),
    [bankAccountsCatalog],
  );

  const historySummaryQuery = useReturnRequestSummary(historyRequest?.id);
  const historyInstallments = historySummaryQuery.data?.parcialidades ?? [];
  const historyRequestFresh = historySummaryQuery.data?.solicitud ?? historyRequest;

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ['operation-returns', parsedOperationId] });
    await queryClient.invalidateQueries({ queryKey: ['return-operation', parsedOperationId] });
    await queryClient.invalidateQueries({ queryKey: ['return-request-summary'] });
    setRefreshKey((prev) => prev + 1);
  }

  const { isSubmitting: isSubmittingPayment, submitAddOperationPayment } =
    useAddOperationPayment({
      onSuccess: async () => {
        setIsAddPaymentModalOpen(false);
        setSelectedOperation(null);
        setRefreshKey((prev) => prev + 1);
      },
    });

  const { isSubmitting: isSubmittingRequest, submitRequestReturnPayment } =
    useRequestReturnPayment({
      onSuccess: async () => {
        setIsAddReturnModalOpen(false);
        setSelectedReturnOperation(null);
        setRefreshKey((prev) => prev + 1);
      },
    });

  const {
    isSubmitting: isSubmittingUpdatePayment,
    submitUpdateOperationPayment,
  } = useUpdateOperationPayment({
    onSuccess: async () => {
      setIsEditPaymentModalOpen(false);
      setSelectedPayment(null);
      setSelectedOperation(null);
      setRefreshKey((prev) => prev + 1);
    },
  });

  const {
    isSubmitting: isSubmittingUpdateReturn,
    submitUpdateRequestReturnPayment,
  } = useUpdateRequestReturnPayment({
    onSuccess: async () => {
      setIsEditReturnModalOpen(false);
      setSelectedReturnToEdit(null);
      setRefreshKey((prev) => prev + 1);
    },
  });

  const { isSubmitting: isSubmittingInstallment, submitCreateReturnInstallment } =
    useCreateReturnInstallment({
      onSuccess: async () => {
        setInstallmentRequest(null);
        await refreshAll();
      },
    });

  const { isSubmitting: isSubmittingConfirm, submitConfirmReturnInstallment } =
    useConfirmReturnInstallment({
      onSuccess: async () => {
        setConfirmTarget(null);
        await refreshAll();
      },
    });

  const { isSubmitting: isSubmittingDeliver, submitDeliverReturnInstallment } =
    useDeliverReturnInstallment({
      onSuccess: async () => {
        setDeliverTarget(null);
        await refreshAll();
      },
    });

  const { isSubmitting: isSubmittingCancel, submitCancelReturnInstallment } =
    useCancelReturnInstallment({
      onSuccess: async () => {
        setCancelTarget(null);
        setCancelReason('');
        await refreshAll();
      },
    });

  if (!operationId || Number.isNaN(parsedOperationId)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        El identificador de la operación no es válido.
      </div>
    );
  }

  const isSocioComercial = roles.includes('SOCIO_COMERCIAL');
  const isJefaCajas = roles.includes('JEFA_CAJAS');
  const isAdmin = roles.includes('ADMIN');

  function canConfirmInstallment(i: ReturnInstallment): boolean {
    return isSocioComercial && i.estatus === 'PROGRAMADA' && isCashReturnMethod(i.tipoPago);
  }
  function canDeliverInstallment(i: ReturnInstallment): boolean {
    return (isJefaCajas || isAdmin) && i.estatus === 'ENTREGADA' && isCashReturnMethod(i.tipoPago);
  }
  function canCancelInstallment(i: ReturnInstallment): boolean {
    if (i.estatus !== 'PROGRAMADA' && i.estatus !== 'ENTREGADA') return false;
    if (isAdmin) return true;
    if (isCashReturnMethod(i.tipoPago)) return isJefaCajas;
    return roles.includes('JEFA_CUENTAS') || roles.includes('AUXILIAR_CUENTAS');
  }

  return (
    <>
      <OperationDetailContainer
        key={refreshKey}
        operationId={parsedOperationId}
        scrollToPayments={scrollToPayments}
        scrollToReturns={scrollToReturns}
        backLabel={backLabel}
        onBack={() => {
          if (isReturnsForRequestDetail) return navigate(paths.returnsforrequest);
          if (isReturnPaymentDetail) return navigate(paths.returnsforpayment);
          if (isReturnsRequestedDetail) return navigate(paths.returnsRequested);
          navigate(paths.operations);
        }}
        onAddPayment={(operation) => {
          setSelectedOperation(operation);
          setIsAddPaymentModalOpen(true);
        }}
        onEditPayment={(operation, paymentId) => {
          const payment = operation.pagos.find((item) => item.id === paymentId);
          if (!payment) return;
          setSelectedOperation(operation);
          setSelectedPayment(payment);
          setIsEditPaymentModalOpen(true);
        }}
        onAddRequestReturnPayment={
          canRequestReturn
            ? (operation) => {
                setSelectedReturnOperation(operation);
                setIsAddReturnModalOpen(true);
              }
            : undefined
        }
        onRegisterInstallment={(returnRequest) => setInstallmentRequest(returnRequest)}
        onViewInstallmentHistory={(returnRequest) => setHistoryRequest(returnRequest)}
        onEditReturn={(returnPayment) => {
          setSelectedReturnToEdit(returnPayment);
          setIsEditReturnModalOpen(true);
        }}
      />

      <Modal
        open={isAddPaymentModalOpen}
        title="Registrar pago de ingreso"
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setSelectedOperation(null);
        }}
      >
        {isLoadingBankAccounts || selectedOperation === null ? (
          <div className="py-8 text-center text-sm text-slate-500">Cargando formulario...</div>
        ) : (
          <AddOperationPaymentForm
            isSubmitting={isSubmittingPayment}
            bankAccounts={bankAccounts}
            montoTotal={selectedOperation.montoTotal}
            montoRegistrado={selectedOperation.montoRegistrado}
            saldoPendiente={selectedOperation.saldoPendientePorRegistrar}
            onSubmit={(values) => submitAddOperationPayment(selectedOperation.id, values)}
          />
        )}
      </Modal>

      <Modal
        open={isEditPaymentModalOpen}
        title="Editar pago de ingreso"
        onClose={() => {
          setIsEditPaymentModalOpen(false);
          setSelectedPayment(null);
          setSelectedOperation(null);
        }}
      >
        {isLoadingBankAccounts || selectedOperation === null || selectedPayment === null ? (
          <div className="py-8 text-center text-sm text-slate-500">Cargando formulario...</div>
        ) : (
          <UpdateOperationPaymentForm
            isSubmitting={isSubmittingUpdatePayment}
            bankAccounts={bankAccounts}
            operation={selectedOperation}
            payment={selectedPayment}
            onSubmit={(values) =>
              submitUpdateOperationPayment(
                selectedPayment.id,
                selectedOperation.id,
                values,
                selectedPayment.comprobanteUrl,
              )
            }
          />
        )}
      </Modal>

      <RequestReturnModal
        open={isAddReturnModalOpen}
        operation={selectedReturnOperation}
        isSubmitting={isSubmittingRequest}
        onClose={() => {
          setIsAddReturnModalOpen(false);
          setSelectedReturnOperation(null);
        }}
        onSubmit={submitRequestReturnPayment}
      />

      <Modal
        open={isEditReturnModalOpen}
        title="Editar solicitud de retorno"
        onClose={() => {
          setIsEditReturnModalOpen(false);
          setSelectedReturnToEdit(null);
        }}
      >
        {selectedReturnToEdit === null ? (
          <div className="py-8 text-center text-sm text-slate-500">Cargando formulario...</div>
        ) : (
          <EditReturnPaymentForm
            payment={selectedReturnToEdit}
            clientId={selectedReturnToEdit?.clientId ?? 0}
            isSubmitting={isSubmittingUpdateReturn}
            onSubmit={submitUpdateRequestReturnPayment}
          />
        )}
      </Modal>

      <RegisterInstallmentModal
        open={!!installmentRequest}
        returnRequest={installmentRequest}
        isSubmitting={isSubmittingInstallment}
        onClose={() => setInstallmentRequest(null)}
        onSubmit={(returnRequestId, values) =>
          submitCreateReturnInstallment(returnRequestId, values)
        }
      />

      <InstallmentHistoryModal
        open={!!historyRequest}
        returnRequest={historyRequestFresh}
        installments={historyInstallments}
        isLoading={historySummaryQuery.isLoading}
        canConfirm={canConfirmInstallment}
        canDeliver={canDeliverInstallment}
        canCancel={canCancelInstallment}
        onConfirm={setConfirmTarget}
        onDeliver={setDeliverTarget}
        onCancel={(i) => {
          setCancelTarget(i);
          setCancelReason('');
        }}
        onClose={() => setHistoryRequest(null)}
      />

      <MarkCashReturnDeliveredModal
        target={deliverTarget ? installmentToCashDeliveryTarget(deliverTarget) : null}
        isSubmitting={isSubmittingDeliver}
        onConfirm={(installmentId, operationId, comprobante) =>
          void submitDeliverReturnInstallment(installmentId, operationId, comprobante)
        }
        onClose={() => setDeliverTarget(null)}
      />

      <Modal
        open={!!confirmTarget}
        title="Confirmar recepción de la parcialidad"
        onClose={() => setConfirmTarget(null)}
      >
        <p className="text-sm text-slate-600">
          ¿Confirmas que recibiste la parcialidad por{' '}
          <span className="font-semibold text-slate-900">
            {confirmTarget ? formatCurrency(confirmTarget.monto) : ''}
          </span>
          ?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setConfirmTarget(null)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmittingConfirm}
            onClick={() =>
              confirmTarget && submitConfirmReturnInstallment(confirmTarget.id)
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmittingConfirm ? 'Confirmando...' : 'Sí, la recibí'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!cancelTarget}
        title="Cancelar parcialidad"
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
      >
        <p className="text-sm text-slate-600">
          Se cancelará la parcialidad por{' '}
          <span className="font-semibold text-slate-900">
            {cancelTarget ? formatCurrency(cancelTarget.monto) : ''}
          </span>
          . El monto vuelve a quedar disponible para registrar.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700">Motivo</label>
        <textarea
          rows={3}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="Explica por qué se cancela esta parcialidad"
        />
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setCancelTarget(null);
              setCancelReason('');
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={isSubmittingCancel || !cancelReason.trim()}
            onClick={() =>
              cancelTarget && submitCancelReturnInstallment(cancelTarget.id, cancelReason)
            }
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isSubmittingCancel ? 'Cancelando...' : 'Cancelar parcialidad'}
          </button>
        </div>
      </Modal>
    </>
  );
}
