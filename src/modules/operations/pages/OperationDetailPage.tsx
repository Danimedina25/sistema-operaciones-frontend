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
import { EditReturnPaymentForm } from '../components/returns/EditReturnPaymentForm';
import { useUpdateRequestReturnPayment } from '../hooks/returns/use-update-request-return-payment';
import { useScheduleCashReturnPickup } from '../hooks/returns/use-schedule-cash-return-pickup';

export default function OperationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);

  const scrollToPayments =
    Boolean(location.state?.scrollToPayments) ||
    searchParams.get('scrollToPayments') === 'true';

  const scrollToReturns =
    Boolean(location.state?.scrollToReturns) ||
    searchParams.get('scrollToReturns') === 'true';
  const isReturnsForRequestDetail =
    location.pathname.startsWith(paths.returnsforrequest);
  const isReturnPaymentDetail =
    location.pathname.startsWith(paths.returnsforpayment);
  const isReturnsRequestedDetail =
    location.pathname.startsWith(paths.returnsRequested);
  let backLabel = 'Operaciones';

  if (isReturnsForRequestDetail) {
    backLabel = 'Retornos por solicitar';
  } else if (isReturnsRequestedDetail) {
    backLabel = 'Retornos solicitados';
  } else if (isReturnPaymentDetail) {
    backLabel = 'Retornos por pagar';
  }
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
  const [isEditReturnModalOpen, setIsEditReturnModalOpen] =
    useState(false);

  const [selectedReturnToEdit, setSelectedReturnToEdit] =
    useState<ReturnPaymentResponse | null>(null);

  const canRequestReturn = user?.roles?.some(
    (role) => role === 'SOCIO_COMERCIAL' || role === 'ADMIN',
  );

  const canPayReturn = user?.roles?.some(
    (role) =>
      role === 'ADMIN' ||
      role === 'JEFA_CAJAS' ||
      role === 'JEFA_CUENTAS' ||
      role === 'AUXILIAR_CUENTAS'
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

  const {
    isSubmitting: isSubmittingScheduleCashPickup,
    submitScheduleCashReturnPickup,
  } = useScheduleCashReturnPickup({
    onSuccess: async () => {
      setIsPayReturnModalOpen(false);
      setSelectedReturnPayment(null);
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
          if (isReturnsForRequestDetail) {
            navigate(paths.returnsforrequest);
            return;
          }

          if (isReturnPaymentDetail) {
            navigate(paths.returnsforpayment);
            return;
          }

          if (isReturnsRequestedDetail) {
            navigate(paths.returnsRequested);
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
        onDefineCashReturnTime={
          canPayReturn
            ? (returnPayment) => {
              setSelectedReturnPayment(returnPayment);
              setIsPayReturnModalOpen(true);
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
        onEditReturn={(returnPayment) => {
          setSelectedReturnToEdit(returnPayment);
          console.log("prueba", returnPayment)
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
        isSubmitting={
          selectedReturnPayment?.tipoPago === 'EFECTIVO' ||
            selectedReturnPayment?.tipoPago === 'RETIRO_SIN_TARJETA'
            ? isSubmittingScheduleCashPickup
            : isSubmittingRealizeReturn
        }
        onClose={() => {
          setIsPayReturnModalOpen(false);
          setSelectedReturnPayment(null);
        }}
        onSubmit={async (returnPaymentId, values) => {
          if (
            selectedReturnPayment?.tipoPago === 'EFECTIVO' ||
            selectedReturnPayment?.tipoPago === 'RETIRO_SIN_TARJETA'
          ) {
            await submitScheduleCashReturnPickup(returnPaymentId, {
              fechaRecoleccionEfectivo: values.fechaRecoleccionEfectivo ?? '',
              horaRecoleccionEfectivo: values.horaRecoleccionEfectivo ?? '',
              cuentaOrigenId: values.cuentaOrigenId,
              observaciones: values.observaciones,
            });

            return;
          }

          if (!values.comprobante) {
            throw new Error('El comprobante es obligatorio');
          }

          await submitRealizeReturnPayment(returnPaymentId, {
            ...values,
            comprobante: values.comprobante,
          });
        }}
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
          <div className="py-8 text-center text-sm text-slate-500">
            Cargando formulario...
          </div>
        ) : (
          <EditReturnPaymentForm
            payment={selectedReturnToEdit}
            clientId={selectedReturnToEdit?.clientId ?? 0}
            isSubmitting={isSubmittingUpdateReturn}
            onSubmit={submitUpdateRequestReturnPayment}
          />
        )}
      </Modal>
    </>
  );
}