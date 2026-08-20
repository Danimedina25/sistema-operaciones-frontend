import { useState, useMemo, useEffect, type ReactNode } from 'react';
import type {
    CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';
import { CommissionBeneficiaryPaymentStatusBadge } from './CommissionBeneficiaryPaymentStatusBadge';
import { formatDate } from '@/modules/operations/utils/operation-formatters';
import { useWhatsAppLink } from '@/shared/hooks/use-whatsapp-link';
import { buildCommissionPaidMessage } from '@/shared/utils/whatsapp-message';
import { paths } from '@/routes/paths';
import { MessageCircle } from 'lucide-react';

interface Props {
    beneficiaries: CommissionPartnerSummaryResponse[];

    onPayBeneficiary: (
        beneficiary: CommissionPartnerSummaryResponse,
    ) => void;

    onViewDetail: (
        beneficiary: CommissionPartnerSummaryResponse,
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

export function CommissionBeneficiariesTable({
    beneficiaries,
    onPayBeneficiary,
    onViewDetail,
    canManagePayments,
}: Props) {

    const { openWhatsApp } = useWhatsAppLink();

    if (!beneficiaries.length) {
        return null;
    }

    function handleNotifyCommissionPaid(beneficiary: CommissionPartnerSummaryResponse) {
        const publicUrl = `${window.location.origin}${paths.miscomisiones}`;

        const message = buildCommissionPaidMessage({
            monto: beneficiary.totalPagadas,
            publicUrl,
        });

        openWhatsApp(message, beneficiary.telefono);
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

    function renderActions(beneficiary: CommissionPartnerSummaryResponse): ReactNode {
        const canPay =
            beneficiary.commissionIdsToPay
                ?.length > 0;

        return (
            <>
                {canPay ? (
                    canManagePayments ? (
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
                        <span className="text-xs text-slate-400">
                            Pendiente de pago
                        </span>
                    )
                ) : beneficiary.paymentProofUrl ? (

                    <button
                        type="button"
                        onClick={() =>
                            window.open(
                                beneficiary.paymentProofUrl!,
                                '_blank',
                            )
                        }
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Ver comprobante
                    </button>

                ) : (
                    <span className="text-xs text-slate-400">
                        Sin comprobante
                    </span>
                )}

                {!canPay && beneficiary.telefono && (
                    <button
                        type="button"
                        onClick={() =>
                            handleNotifyCommissionPaid(
                                beneficiary,
                            )
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Avisar por WhatsApp
                    </button>
                )}
            </>
        );
    }

    return (
        <>
            {/* Desktop / tablet ancho: tabla completa */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 md:block">

                <div className="overflow-x-auto">

                    <table className="min-w-full">

                        <thead className="bg-slate-100">

                            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">

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

                                    // Estatus autoritativo del backend, derivado
                                    // de commissionIdsToPay (misma fuente que
                                    // canPay dentro de renderActions) — no de
                                    // totalPendientes, que puede dar $0 con
                                    // comisiones GENERADA de monto $0.
                                    const paymentStatus = beneficiary.estatus;

                                    return (

                                        <tr
                                            key={`${beneficiary.beneficiaryType}-${beneficiary.beneficiaryId}`}
                                            className="border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40"
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
                                                    {renderActions(beneficiary)}
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

            {/* Móvil: tarjetas apiladas */}
            <div className="space-y-3 md:hidden">

                {paginatedBeneficiaries.map(
                    beneficiary => {

                        const paymentStatus = beneficiary.estatus;

                        return (
                            <div
                                key={`${beneficiary.beneficiaryType}-${beneficiary.beneficiaryId}`}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {beneficiary.nombre}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {beneficiary.beneficiaryType ===
                                                'COMMERCIAL_PARTNER'
                                                ? 'Socio comercial'
                                                : 'Usuario'}
                                        </p>
                                    </div>
                                    <CommissionBeneficiaryPaymentStatusBadge
                                        status={paymentStatus}
                                    />
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Operaciones</p>
                                        <p className="font-medium text-slate-900">{beneficiary.totalOperaciones}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Total a pagar</p>
                                        <p className="font-medium text-slate-900">{formatCurrency(beneficiary.totalComisiones)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Total pagado</p>
                                        <p className="font-medium text-emerald-700">{formatCurrency(beneficiary.totalPagadas)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Pendiente</p>
                                        <p className="font-medium text-yellow-600">{formatCurrency(beneficiary.totalPendientes)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">Fecha pago</p>
                                        <p className="font-medium text-slate-900">
                                            {paymentStatus === 'PAGADA'
                                                ? formatDate(beneficiary.fechaPagada)
                                                : '--'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onViewDetail(beneficiary)}
                                        className="min-h-[44px] w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Ver detalle
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {renderActions(beneficiary)}
                                    </div>
                                </div>
                            </div>
                        );
                    },
                )}

            </div>

            {/* Paginación: compartida entre desktop y móvil */}
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-950/5">

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
        </>
    );
}
