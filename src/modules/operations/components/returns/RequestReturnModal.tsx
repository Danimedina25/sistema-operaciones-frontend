// components/returns/RequestReturnModal.tsx

import { Modal } from '@/shared/components/ui/Modal';
import { PaymentOperationResponse } from '../../types/operations.types.ts';
import { RequestReturnForm, RequestReturnFormValues } from './RequestReturnForm';

interface RequestReturnModalProps {
    open: boolean;
    operation: PaymentOperationResponse | null;
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
    isSubmitting,
    onClose,
    onSubmit,
}: RequestReturnModalProps) {
    return (
        <Modal open={open} title="Solicitar retorno" onClose={onClose}>
            {operation === null ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Cargando formulario...
                </div>
            ) : (
                <RequestReturnForm
                    isSubmitting={isSubmitting}
                    montoTotalRetornar={operation.montoTotalDevolverCliente}
                    montoSolicitado={operation.montoSolicitadoRetorno}
                    faltaPorSolicitar={
                        operation.montoTotalDevolverCliente -
                        operation.montoSolicitadoRetorno
                    }
                    clienteNombre={operation.clienteNombre}
                    operationId={operation.id}
                    onSubmit={async (values) => {
                        await onSubmit(operation.id, values);
                    }}
                />
            )}
        </Modal>
    );
}