// components/returns/RequestReturnModal.tsx

import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { PaymentOperationResponse, ReturnPaymentResponse } from '../../types/operations.types.ts';
import { RequestReturnForm, RequestReturnFormValues } from './RequestReturnForm';

interface RequestReturnModalProps {
    open: boolean;
    operation: PaymentOperationResponse | null;
    returnPayments?: ReturnPaymentResponse[];
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (
        operationId: number,
        values: RequestReturnFormValues
    ) => Promise<void>;
}

export function RequestReturnModal({
    open,
    operation,
    returnPayments,
    isSubmitting,
    onClose,
    onSubmit,
}: RequestReturnModalProps) {

    const isEdit = !!returnPayments?.length;

    return (
        <ActionDrawer open={open} busy={isSubmitting}
            title={isEdit ? 'Editar solicitud de retorno' : 'Solicitar retorno'}
            subtitle={operation ? `Operación #${operation.id} · ${operation.clienteNombre}` : undefined}
            onClose={onClose}>
            {operation === null ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Cargando formulario...
                </div>
            ) : (
                <RequestReturnForm
                    hideClientName
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                    montoTotalRetornar={operation.montoTotalDevolverCliente}
                    montoSolicitado={operation.montoSolicitadoRetorno}
                    faltaPorSolicitar={
                        operation.montoTotalDevolverCliente -
                        operation.montoSolicitadoRetorno
                    }
                    clienteNombre={operation.clienteNombre}
                    clientId={operation.clienteId}
                    operationId={operation.id}
                    initialPayments={returnPayments}
                    onSubmit={async (values) => {
                        await onSubmit(operation.id, values);
                    }}
                />
            )}
        </ActionDrawer>
    );
}
