import {
    CommissionBeneficiaryResponse,
} from '../types/commercial-partner-commissions.types';

import {
    CommissionBeneficiaryStatusBadge,
} from './CommissionBeneficiaryStatusBadge';

interface CommissionBeneficiariesTableProps {
    beneficiaries: CommissionBeneficiaryResponse[];

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

export function CommissionBeneficiariesTable({
    beneficiaries,
    onPayCommission,
}: CommissionBeneficiariesTableProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50">
                        <tr className="text-left text-sm text-slate-600">
                            <th className="px-4 py-3">
                                Nivel
                            </th>

                            <th className="px-4 py-3">
                                Nombre
                            </th>

                            <th className="px-4 py-3">
                                Banco
                            </th>

                            <th className="px-4 py-3">
                                Cuenta
                            </th>

                            <th className="px-4 py-3">
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

                            <th className="px-4 py-3">
                                Acción
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {beneficiaries.map(
                            (beneficiary) => {
                                const isPaid =
                                    beneficiary.status ===
                                    'PAID';

                                return (
                                    <tr
                                        key={
                                            beneficiary.commissionId
                                        }
                                        className="border-t border-slate-200 text-sm"
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
                                            <button
                                                type="button"
                                                disabled={isPaid}
                                                onClick={() =>
                                                    onPayCommission(
                                                        beneficiary,
                                                    )
                                                }
                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                {isPaid
                                                    ? 'Pagada'
                                                    : 'Pagar'}
                                            </button>
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