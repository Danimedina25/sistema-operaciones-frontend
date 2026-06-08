import { Modal } from '@/shared/components/ui/Modal';

import {
    CommissionBeneficiariesTable,
} from './CommissionBeneficiariesTable';

import type {
    CommissionOperationDetailResponse,
    CommissionBeneficiaryResponse,
} from '../types/commercial-partner-commissions.types';

interface CommissionOperationDetailModalProps {
    open: boolean;

    detail:
    | CommissionOperationDetailResponse
    | null;

    isLoading?: boolean;

    onClose: () => void;

    onPayCommission: (
        beneficiary: CommissionBeneficiaryResponse,
    ) => void;
}

function formatCurrency(
    value: number,
) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
        },
    ).format(value);
}

export function CommissionOperationDetailModal({
    open,
    detail,
    isLoading = false,
    onClose,
    onPayCommission,
}: CommissionOperationDetailModalProps) {
    return (
        <Modal
            open={open}
            title="Detalle de Comisiones de la Operación"
            onClose={onClose}
        >
            {isLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Cargando detalle...
                </div>
            ) : !detail ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    No se encontró información.
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Folio
                            </p>

                            <p className="mt-1 font-medium">
                                #{detail.operationId}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Cliente
                            </p>

                            <p className="mt-1 font-medium">
                                {detail.cliente}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Monto operación
                            </p>

                            <p className="mt-1 font-medium">
                                {formatCurrency(
                                    detail.montoOperacion,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Comisión a pagar a socios comerciales
                            </p>

                            <p className="mt-1 font-medium">
                                {formatCurrency(
                                    detail.totalCommissionAmount,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Niveles de socios comerciales en la operación
                            </p>

                            <p className="mt-1 font-medium">
                                {
                                    detail.nivelesRedComercial
                                }
                            </p>
                        </div>

                        {/*  <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Porcentaje comisión total red de socios comerciales
                            </p>

                            <p className="mt-1 font-medium">
                                {
                                    detail.porcentajeComisionTotalRed
                                }
                                %
                            </p>
                        </div> */}

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Porcentaje comisión por socio comercial
                            </p>

                            <p className="mt-1 font-medium">
                                {
                                    detail.porcentajeComisionIndividual
                                }
                                %
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-base font-semibold text-slate-900">
                            Socios comerciales beneficiarios de la operación
                        </h3>

                        <CommissionBeneficiariesTable
                            beneficiaries={
                                detail.beneficiarios
                            }
                            onPayCommission={
                                onPayCommission
                            }
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}