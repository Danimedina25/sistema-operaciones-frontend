import { useState, useMemo, useEffect } from 'react';
import type {
    CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';
import { CommissionBeneficiaryPaymentStatusBadge } from './CommissionBeneficiaryPaymentStatusBadge';
import { formatDate } from '@/modules/operations/utils/operation-formatters';

interface Props {
    beneficiaries: CommissionPartnerSummaryResponse[];

    onPayBeneficiary: (
        beneficiary: CommissionPartnerSummaryResponse,
    ) => void;

    onViewDetail: (
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
    onViewDetail,
}: Props) {

    if (!beneficiaries.length) {
        return null;
    }

    useEffect(
        () => {
            setPage(1);
        },
        [beneficiaries],
    );

    const ITEMS_PER_PAGE = 10;

    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(
        beneficiaries.length / ITEMS_PER_PAGE,
    );

    const paginatedBeneficiaries =
        useMemo(
            () => {

                const start =
                    (page - 1) * ITEMS_PER_PAGE;

                return beneficiaries.slice(
                    start,
                    start + ITEMS_PER_PAGE,
                );

            },
            [beneficiaries, page],
        );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-50">

                        <tr className="text-left text-sm text-slate-600">

                            <th className="px-4 py-3 text-center">
                                Beneficiario
                            </th>

                            <th className="px-4 py-3 text-center">
                                Operaciones
                            </th>

                            <th className="px-4 py-3 text-center">
                                Total a pagar
                            </th>

                            <th className="px-4 py-3 text-center">
                                Total pagado
                            </th>

                            <th className="px-4 py-3 text-center">
                                Pendiente por pagar
                            </th>

                            <th className="px-4 py-3 text-center">
                                Estatus
                            </th>

                            <th className="px-4 py-3 text-center">
                                Fecha pago
                            </th>

                            <th className="px-4 py-3 text-center">
                                Opciones
                            </th>

                            <th className="px-4 py-3 text-center">
                                Acción
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {paginatedBeneficiaries.map(
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

                                        <td className="px-4 py-4 text-center">

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

                                        <td className="px-4 py-4 text-center">
                                            {beneficiary.totalOperaciones}
                                        </td>

                                        <td className="px-4 py-4 font-medium text-center">

                                            {formatCurrency(
                                                beneficiary.totalComisiones,
                                            )}

                                        </td>

                                        <td className="px-4 py-4 text-emerald-700 text-center">

                                            {formatCurrency(
                                                beneficiary.totalPagadas,
                                            )}

                                        </td>

                                        <td className="px-4 py-4 text-yellow-500 text-center">

                                            {formatCurrency(
                                                beneficiary.totalPendientes
                                            )}

                                        </td>

                                        <td className="px-4 py-4 text-center">

                                            <CommissionBeneficiaryPaymentStatusBadge
                                                status={paymentStatus}
                                            />

                                        </td>

                                        <td className="px-4 py-4 text-emerald-700 text-center">
                                            {paymentStatus === 'PAGADA' ? (
                                                <>

                                                    {
                                                        formatDate(beneficiary.fechaPagada)
                                                    }
                                                </>

                                            )
                                                :
                                                <span className="text-xs text-slate-400">
                                                    --
                                                </span>
                                            }
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onViewDetail(
                                                            beneficiary,
                                                        )
                                                    }
                                                    className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
                                                >
                                                    Ver detalle
                                                </button>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canPay ? (

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onPayBeneficiary(
                                                                beneficiary,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
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
                                                        className="
    inline-flex
    h-9
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

                                                )}

                                            </div>

                                        </td>
                                    </tr>

                                );
                            },
                        )}

                    </tbody>

                </table>

                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">

                    <p className="text-sm text-slate-500">
                        Mostrando {
                            Math.min(
                                (page - 1) * ITEMS_PER_PAGE + 1,
                                beneficiaries.length,
                            )
                        }
                        -
                        {
                            Math.min(
                                page * ITEMS_PER_PAGE,
                                beneficiaries.length,
                            )
                        }
                        {' '}de{' '}
                        {beneficiaries.length} beneficiarios
                    </p>

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() =>
                                setPage(
                                    prev => prev - 1,
                                )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        <span className="text-sm text-slate-600">
                            Página {page} de {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={
                                page === totalPages
                            }
                            onClick={() =>
                                setPage(
                                    prev => prev + 1,
                                )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Siguiente
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}