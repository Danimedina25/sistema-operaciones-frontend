import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { Modal } from '@/shared/components/ui/Modal';
import { OperationDetailContainer } from '../components/OperationDetailContainer';
import { AddOperationPaymentForm } from '../components/AddOperationPaymentForm';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { useAddOperationPayment } from '../hooks/use-add-operation-payment';
import { OperationPaymentResponse, PaymentOperationResponse, ReturnPaymentResponse } from '../types/operations.types.ts';
import { useUpdateOperationPayment } from '../hooks/use-update-operation-payment';
import { UpdateOperationPaymentForm } from '../components/UpdateOperationPaymentForm';
import { useAuth } from '@/modules/auth/store/auth.context';
import { useRequestReturnPayment } from '../hooks/returns/use-request-return-payment';
import { RequestReturnModal } from '../components/returns/RequestReturnModal';
import { RealizeReturnPaymentModal } from '../components/returns/RealizeReturnPaymentModal';
import { useRealizeReturnPayment } from '../hooks/returns/use-realize-return-payment';

export default function OperationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollToPayments = Boolean(location.state?.scrollToPayments);
  const scrollToReturns = Boolean(location.state?.scrollToReturns);
  const isReturnRequestDetail =
    location.pathname.startsWith(paths.returnsforrequest);
  const isReturnPaymentDetail =
    location.pathname.startsWith(paths.returnsforpayment);
  const backLabel = isReturnRequestDetail
    ? 'Retornos por solicitar'
    : isReturnPaymentDetail
      ? 'Retornos por registrar'
      : 'Operaciones';
  const { operationId } = useParams<{ operationId: string }>();
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<PaymentOperationResponse | null>(null);
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [isPayReturnModalOpen, setIsPayReturnModalOpen] = useState(false);
  const [selectedReturnPayment, setSelectedReturnPayment] =
    useState<ReturnPaymentResponse | null>(null);
  const [selectedReturnOperation, setSelectedReturnOperation] =
    useState<PaymentOperationResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<OperationPaymentResponse | null>(null);
  const { user } = useAuth();

  const canRequestReturn = user?.roles?.some(
    (role) => role === 'SOCIO_COMERCIAL' || role === 'ADMIN',
  );

  const canPayReturn = user?.roles?.some(
    (role) => role === 'ADMIN' || role === 'GERENTE',
  );

  const parsedOperationId = Number(operationId);

  const {
    accounts: bankAccountsCatalog,
    isLoading: isLoadingBankAccounts,
  } = useBankAccounts();

  const bankAccounts = useMemo(() => {
    return bankAccountsCatalog
      .filter((account) => account.activo)
      .map((account) => ({
        id: account.id,
        label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
      }));
  }, [bankAccountsCatalog]);

  const { isSubmitting: isSubmittingPayment, submitAddOperationPayment } =
    useAddOperationPayment({
      onSuccess: async () => {
        setIsAddPaymentModalOpen(false);
        setSelectedOperation(null);
        setRefreshKey((prev) => prev + 1);
      },
    });

  const { isSubmitting, submitRequestReturnPayment } =
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
    isSubmitting: isSubmittingRealizeReturn,
    submitRealizeReturnPayment,
  } = useRealizeReturnPayment({
    onSuccess: async () => {
      setIsPayReturnModalOpen(false);
      setSelectedReturnPayment(null);
      setRefreshKey((prev) => prev + 1);
    },
  });

  if (!operationId || Number.isNaN(parsedOperationId)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        El identificador de la operación no es válido.
      </div>
    );
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
          if (isReturnRequestDetail) {
            navigate(paths.returnsforrequest);
            return;
          }

          if (isReturnPaymentDetail) {
            navigate(paths.returnsforpayment);
            return;
          }

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
        onAddReturnPayment={
          canRequestReturn
            ? (operation) => {
              setSelectedReturnOperation(operation);
              setIsAddReturnModalOpen(true);
            }
            : undefined
        }
        onAddRequestReturnPayment={
          canRequestReturn
            ? (operation) => {
              setSelectedReturnOperation(operation);
              setIsAddReturnModalOpen(true);
            }
            : undefined
        }
        onPayReturn={
          canPayReturn
            ? (returnPayment) => {
              setSelectedReturnPayment(returnPayment);
              setIsPayReturnModalOpen(true);
            }
            : undefined
        }
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
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
          <AddOperationPaymentForm
            isSubmitting={isSubmittingPayment}
            bankAccounts={bankAccounts}
            montoTotal={selectedOperation.montoTotal}
            montoRegistrado={selectedOperation.montoRegistrado}
            saldoPendiente={selectedOperation.saldoPendientePorRegistrar}
            onSubmit={(values) =>
              submitAddOperationPayment(selectedOperation.id, values)
            }
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
        {isLoadingBankAccounts ||
          selectedOperation === null ||
          selectedPayment === null ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
          <UpdateOperationPaymentForm
            isSubmitting={isSubmittingUpdatePayment}
            bankAccounts={bankAccounts}
            operation={selectedOperation}
            payment={selectedPayment}
            onSubmit={(values, comprobanteUrl) =>
              submitUpdateOperationPayment(
                selectedPayment.id,
                values,
                comprobanteUrl,
              )
            }
          />
        )}
      </Modal>

      <RequestReturnModal
        open={isAddReturnModalOpen}
        operation={selectedReturnOperation}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsAddReturnModalOpen(false);
          setSelectedReturnOperation(null);
        }}
        onSubmit={submitRequestReturnPayment}
      />

      <RealizeReturnPaymentModal
        open={isPayReturnModalOpen}
        returnPayment={selectedReturnPayment}
        isSubmitting={isSubmittingRealizeReturn}
        onClose={() => {
          setIsPayReturnModalOpen(false);
          setSelectedReturnPayment(null);
        }}
        onSubmit={submitRealizeReturnPayment}
      />
    </>
  );
}