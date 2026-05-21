import { Modal } from '@/shared/components/ui/Modal';

import { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { RealizeReturnPaymentForm, RealizeReturnPaymentFormValues } from './RealizeReturnPaymentForm.js';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts.js';
import { useMemo } from 'react';
import { RealizeReturnPaymentValues } from '../../hooks/returns/use-realize-return-payment.js';

interface RealizeReturnPaymentModalProps {
  open: boolean;
  returnPayment: ReturnPaymentResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    returnPaymentId: number,
    values: RealizeReturnPaymentValues,
  ) => Promise<void>;
}

export function RealizeReturnPaymentModal({
    open,
    returnPayment,
    isSubmitting,
    onClose,
    onSubmit,
}: RealizeReturnPaymentModalProps) {
    const { accounts } = useBankAccounts();

    const bankAccounts = useMemo(() => {
        return accounts
            .filter((account) => account.activo)
            .map((account) => ({
                id: account.id,
                label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}`,
            }));
    }, [accounts]);

    return (
        <Modal open={open} title="Pagar retorno" onClose={onClose}>
            {returnPayment === null ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Cargando formulario...
                </div>
            ) : (
                <RealizeReturnPaymentForm
                    bankAccounts={bankAccounts}
                    returnPayment={returnPayment}
                    isSubmitting={isSubmitting}
                    onSubmit={async (values) => {
                        await onSubmit(returnPayment.id, {
                            ...values,
                            operationId: returnPayment.operationId,
                        });
                    }}
                />
            )}
        </Modal>
    );
}