import { useMemo } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';
import {
  RegisterInstallmentForm,
  type RegisterInstallmentFormValues,
} from './RegisterInstallmentForm';

interface RegisterInstallmentModalProps {
  open: boolean;
  returnRequest: ReturnPaymentResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    returnRequestId: number,
    values: RegisterInstallmentFormValues & { operationId: number },
  ) => Promise<void>;
}

export function RegisterInstallmentModal({
  open,
  returnRequest,
  isSubmitting,
  onClose,
  onSubmit,
}: RegisterInstallmentModalProps) {
  const { accounts } = useBankAccounts();

  const bankAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.activo)
        .map((account) => ({
          id: account.id,
          label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
        })),
    [accounts],
  );

  return (
    <Modal open={open} title="Registrar parcialidad" onClose={onClose}>
      {returnRequest === null ? (
        <div className="py-8 text-center text-sm text-slate-500">Cargando formulario...</div>
      ) : (
        <RegisterInstallmentForm
          returnRequest={returnRequest}
          bankAccounts={bankAccounts}
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            await onSubmit(returnRequest.id, {
              ...values,
              operationId: returnRequest.operationId,
            });
          }}
        />
      )}
    </Modal>
  );
}
