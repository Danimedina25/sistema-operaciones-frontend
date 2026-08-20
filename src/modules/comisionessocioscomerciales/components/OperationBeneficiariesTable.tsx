import {
    CommissionBeneficiaryResponse,
} from '../types/commercial-partner-commissions.types';

import {
    CommissionBeneficiaryStatusBadge,
} from './CommissionBeneficiaryStatusBadge';

interface OperationBeneficiariesTableProps {
    beneficiaries: CommissionBeneficiaryResponse[];

    onPayCommission: (
        beneficiary: CommissionBeneficiaryResponse,
    ) => void;

    canManagePayments: boolean;
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

export function OperationBeneficiariesTable({
    beneficiaries,
    onPayCommission,
    canManagePayments,
}: OperationBeneficiariesTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-100">
                        <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            <th className="px-4 py-3">
                                Nivel
                            </th>

                            <th className="min-w-[160px] px-4 py-3">
                                Nombre
                            </th>

                            <th className="min-w-[140px] px-4 py-3">
                                Banco
                            </th>

                            <th className="min-w-[140px] px-4 py-3">
                                Cuenta
                            </th>

                            <th className="min-w-[160px] px-4 py-3">
                                Titular
                            </th>

                            <th className="px-4 py-3">
                                Porcentaje
                            </th>

                            <th className="px-4 py-3">
                                Comisión
                            </th>

                            <th className="px-4 py-3">
                                Estatus
                            </th>

                            <th className="px-4 py-3 text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {beneficiaries.map(
                            (beneficiary) => {
                                const isPaid =
                                    beneficiary.status ===
                                    'PAGADA';
                                const canViewProof =
                                    isPaid &&
                                    beneficiary.paymentProofUrl;

                                return (
                                    <tr
                                        key={
                                            beneficiary.commissionId
                                        }
                                        className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
                                    >
                                        <td className="px-4 py-4">
                                            Nivel{' '}
                                            {
                                                beneficiary.nivel
                                            }
                                        </td>

                                        <td className="px-4 py-4">
                                            {beneficiary.nombre}
                                        </td>

                                        <td className="px-4 py-4">
                                            {beneficiary.banco}
                                        </td>

                                        <td className="px-4 py-4">
                                            {
                                                beneficiary.cuentaBancaria
                                            }
                                        </td>

                                        <td className="px-4 py-4">
                                            {
                                                beneficiary.titularCuenta
                                            }
                                        </td>

                                        <td className="px-4 py-4">
                                            {
                                                beneficiary.commissionPercentage
                                            }
                                            %
                                        </td>

                                        <td className="px-4 py-4">
                                            {formatCurrency(
                                                beneficiary.commissionAmount,
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <CommissionBeneficiaryStatusBadge
                                                status={
                                                    beneficiary.status
                                                }
                                            />
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                {canViewProof ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.open(
                                                                beneficiary.paymentProofUrl!,
                                                                '_blank',
                                                            )
                                                        }
                                                        className="
    inline-flex
    min-h-[40px]
    items-center
    justify-center
    rounded-lg
    border
    border-slate-300
    bg-white
    px-4
    text-xs
    font-medium
    text-slate-700
    shadow-sm
    transition
    hover:bg-slate-50
  "
                                                    >
                                                        Ver comprobante
                                                    </button>
                                                ) : isPaid ? (
                                                    <span className="text-xs text-slate-400">
                                                        Sin comprobante
                                                    </span>
                                                ) : canManagePayments ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onPayCommission(
                                                                beneficiary,
                                                            )
                                                        }
                                                        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                                    >
                                                        Pagar
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Pendiente de pago
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}