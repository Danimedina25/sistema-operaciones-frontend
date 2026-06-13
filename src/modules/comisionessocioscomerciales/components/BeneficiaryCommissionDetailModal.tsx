import { formatDate, formatPeriodDate } from '@/modules/operations/utils/operation-formatters';
import {
    BeneficiaryCommissionDetailResponse,
} from '../types/commercial-partner-commissions.types';

import { Modal } from '@/shared/components/ui/Modal';

interface Props {
    open: boolean;

    onClose: () => void;

    detail: BeneficiaryCommissionDetailResponse | null;

    isLoading: boolean;

    startDate: string;

    endDate: string;
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


function LevelBadge({
    level,
}: {
    level: number;
}) {

    const color =
        level === 1
            ? 'bg-slate-900'
            : level === 2
                ? 'bg-sky-600'
                : 'bg-emerald-600';

    return (
        <div
            className={`
        flex h-8 w-8 items-center justify-center
        rounded-full text-xs font-bold text-white
        ${color}
      `}
        >
            N{level}
        </div>
    );
}

export function BeneficiaryCommissionDetailModal({
    open,
    onClose,
    detail,
    isLoading,
    startDate, 
    endDate
}: Props) {

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Detalle de comisiones · ${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}`}
        >
            {isLoading ? (

                <div className="flex items-center justify-center py-16">

                    <div className="text-sm text-slate-500">
                        Cargando detalle...
                    </div>

                </div>

            ) : !detail ? (

                <div className="flex items-center justify-center py-16">

                    <div className="text-sm text-slate-500">
                        No se encontró información.
                    </div>

                </div>

            ) : (

                <div className="space-y-6">

                    {/* HEADER */}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <h2 className="text-xl font-semibold text-slate-900">

                                    {detail.beneficiaryName}

                                </h2>

                                <p className="mt-1 text-sm text-slate-500">

                                    {detail.beneficiaryType ===
                                        'COMMERCIAL_PARTNER'
                                        ? 'Socio comercial'
                                        : 'Usuario'}

                                </p>

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">

                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Operaciones en la semana
                                    </p>

                                    <p className="mt-2 text-xl font-bold text-slate-900">
                                        {detail.totalOperations}
                                    </p>

                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

                                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                                        Total comisión semanal
                                    </p>

                                    <p className="mt-2 text-xl font-bold text-emerald-900">
                                        {formatCurrency(
                                            detail.totalCommission,
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* TABLA */}

                    <div className="rounded-2xl border border-slate-200 bg-white">

                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                <thead className="bg-slate-50">

                                    <tr className="text-left text-sm text-slate-600">

                                        <th className="px-4 py-3">
                                            Folio operación
                                        </th>

                                        <th className="px-4 py-3">
                                            Cliente
                                        </th>

                                        <th className="px-4 py-3">
                                            Fecha de creación 
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Nivel
                                        </th>

                                        <th className="px-4 py-3">
                                            Monto operación
                                        </th>

                                        <th className="px-4 py-3">
                                            Porcentaje comisión
                                        </th>

                                        <th className="px-4 py-3">
                                            Comisión
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {detail.operations.map(
                                        operation => (

                                            <tr
                                                key={
                                                    operation.commissionId
                                                }
                                                className="border-t border-slate-200 text-sm"
                                            >

                                                <td className="px-4 py-4 font-medium">

                                                    #{operation.operationId}

                                                </td>

                                                <td className="px-4 py-4">

                                                    {operation.clienteNombre}

                                                </td>

                                                <td className="px-4 py-4">

                                                    {formatDate(
                                                        operation.operationDate,
                                                    )}

                                                </td>

                                                <td className="px-4 py-4">

                                                    <div className="flex justify-center">

                                                        <LevelBadge
                                                            level={
                                                                operation.nivel
                                                            }
                                                        />

                                                    </div>

                                                </td>

                                                <td className="px-4 py-4">

                                                    {formatCurrency(
                                                        operation.operationAmount,
                                                    )}

                                                </td>

                                                <td className="px-4 py-4">

                                                    {
                                                        operation.commissionPercentage
                                                    }%

                                                </td>

                                                <td className="px-4 py-4 font-semibold text-emerald-700">

                                                    {formatCurrency(
                                                        operation.commissionAmount,
                                                    )}

                                                </td>

                                            </tr>

                                        ),
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}
        </Modal>
    );
}