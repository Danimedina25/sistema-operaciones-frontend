import type {
    CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';
import { CommissionBeneficiaryPaymentStatusBadge } from './CommissionBeneficiaryPaymentStatusBadge';

interface Props {
    beneficiaries: CommissionPartnerSummaryResponse[];

    onPayBeneficiary: (
        beneficiary: CommissionPartnerSummaryResponse,
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
    onPayBeneficiary,
}: Props) {

    if (!beneficiaries.length) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-50">

                        <tr className="text-left text-sm text-slate-600">

                            <th className="px-4 py-3 text-left">
                                Beneficiario
                            </th>

                            <th className="px-4 py-3 text-left">
                                Operaciones
                            </th>

                            <th className="px-4 py-3 text-left">
                                Total a pagar
                            </th>

                            <th className="px-4 py-3 text-left">
                                Total pagado
                            </th>

                            <th className="px-4 py-3 text-left">
                                Pendiente por pagar
                            </th>

                            <th className="px-4 py-3 text-center">
                                Estatus
                            </th>

                            <th className="px-4 py-3 text-center">
                                Acción
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {beneficiaries.map(
                            beneficiary => {

                                const canPay =
                                    beneficiary.commissionIdsToPay
                                        ?.length > 0;

                                const paymentStatus =
                                    beneficiary.totalPendientes === 0
                                        ? 'PAGADA'
                                        : beneficiary.totalPagadas === 0
                                            ? 'PENDIENTE'
                                            : 'PARCIAL';

                                return (

                                    <tr
                                        key={`${beneficiary.beneficiaryType}-${beneficiary.beneficiaryId}`}
                                        className="border-t border-slate-200 text-sm"
                                    >

                                        <td className="px-4 py-4 text-left">

                                            <div className="font-medium">
                                                {beneficiary.nombre}
                                            </div>

                                            <div className="text-xs text-slate-500">

                                                {beneficiary.beneficiaryType ===
                                                    'COMMERCIAL_PARTNER'
                                                    ? 'Socio comercial'
                                                    : 'Usuario'}

                                            </div>

                                        </td>

                                        <td className="px-4 py-4 text-left">
                                            {beneficiary.totalOperaciones}
                                        </td>

                                        <td className="px-4 py-4 font-medium text-left">

                                            {formatCurrency(
                                                beneficiary.totalComisiones,
                                            )}

                                        </td>

                                        <td className="px-4 py-4 text-emerald-700 text-left">

                                            {formatCurrency(
                                                beneficiary.totalPagadas,
                                            )}

                                        </td>


                                        <td className="px-4 py-4 text-yellow-500 text-left">

                                            {formatCurrency(
                                                beneficiary.totalPendientes
                                            )}

                                        </td>

                                        <td className="px-4 py-4 text-center">

                                            <CommissionBeneficiaryPaymentStatusBadge
                                                status={paymentStatus}
                                            />

                                        </td>

                                        <td className="px-4 py-4 text-center">

                                            {canPay ? (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onPayBeneficiary(
                                                            beneficiary,
                                                        )
                                                    }
                                                    className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium transition hover:bg-emerald-50"
                                                >
                                                    Pagar
                                                </button>

                                            ) : (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        window.open(
                                                            beneficiary.paymentProofUrl!,
                                                            '_blank',
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                >
                                                    Ver comprobante
                                                </button>

                                            )}

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