import { formatDate } from '@/modules/operations/utils/operation-formatters';

import type {
    MyWeeklyCommissionOperationResponse,
} from '../types/commercial-partner-commissions.types';
import { useMemo, useState } from 'react';

interface Props {
    operations:
    MyWeeklyCommissionOperationResponse[];
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

function StatusBadge({
    status,
}: {
    status:
    | 'GENERADA'
    | 'PAGADA'
    | null;
}) {

    if (!status) {
        return (
            <span className="text-[10px] text-slate-400">
                —
            </span>
        );
    }

    const isPaid =
        status === 'PAGADA';

    return (
        <span
            className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isPaid
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
                }`}
        >
            {status}
        </span>
    );
}

export function MyCommissionsTable({
    operations,
}: Props) {

    const ITEMS_PER_PAGE = 10;

    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(
        operations.length / ITEMS_PER_PAGE,
    );

    const paginatedOperations =
        useMemo(
            () => {
                const start =
                    (page - 1) * ITEMS_PER_PAGE;

                return operations.slice(
                    start,
                    start + ITEMS_PER_PAGE,
                );
            },
            [operations, page],
        );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-50">

                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                            <th className="px-4 py-4">
                                Folio
                            </th>

                            <th className="px-4 py-4">
                                Cliente
                            </th>

                            <th className="px-4 py-4">
                                Fecha
                            </th>

                            <th className="px-4 py-4">
                                Monto operación
                            </th>

                            <th className="px-4 py-4">
                                Nivel socios comerciales
                            </th>

                             <th className="px-4 py-4">
                                Porcentaje de comisión
                            </th>

                            <th className="px-4 py-4">
                                Nivel 1 (yo)
                            </th>

                            <th className="px-4 py-4">
                                Nivel 2
                            </th>

                            <th className="px-4 py-4">
                                Nivel 3
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {paginatedOperations.map(
                            (
                                operation,
                            ) => (

                                <tr
                                    key={
                                        operation.operationId
                                    }
                                    className="border-t border-slate-200 text-sm hover:bg-slate-50"
                                >

                                    <td className="px-4 py-4">

                                        <div className="font-semibold text-slate-900">
                                            #
                                            {
                                                operation.operationId
                                            }
                                        </div>

                                    </td>

                                    <td className="px-4 py-4">

                                        <div className="font-medium text-slate-900">
                                            {
                                                operation.cliente
                                            }
                                        </div>

                                    </td>

                                    <td className="px-4 py-4 text-slate-600">

                                        {formatDate(
                                            operation.fechaOperacion,
                                        )}

                                    </td>

                                    <td className="px-4 py-4">

                                        <div className="font-medium text-slate-900">
                                            {formatCurrency(
                                                operation.montoOperacion,
                                            )}
                                        </div>

                                    </td>


                                    <td className="px-4 py-4">

                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">

                                            {
                                                operation.nivelesRedComercial
                                            } niveles

                                        </span>

                                    </td>

                                      <td className="px-4 py-4">

                                        <div className="font-medium text-slate-900">
                                            {operation.porcentajeComision}%
                                        </div>

                                    </td>

                                    {/* MI COMISION */}

                                    <td className="px-3 py-3">

                                        <div className="w-[140px] rounded-lg border border-slate-200 bg-slate-50 p-2.5">

                                            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                                                Mi comisión
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-emerald-800">
                                                {formatCurrency(
                                                    operation.miComision,
                                                )}
                                            </p>

                                            <div className="mt-2">
                                                <StatusBadge
                                                    status={
                                                        operation.myCommissionStatus
                                                    }
                                                />
                                            </div>

                                        </div>

                                    </td>

                                    {/* NIVEL 2 */}

                                    <td className="px-3 py-3">

                                        {operation.socioNivel2 ? (

                                            <div className="w-[140px] rounded-lg border border-slate-200 bg-slate-50 p-2.5">

                                                <p className="truncate text-[10px] font-medium text-slate-500">
                                                    {operation.socioNivel2}
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {formatCurrency(
                                                        operation.comisionNivel2,
                                                    )}
                                                </p>

                                                <div className="mt-2">
                                                    <StatusBadge
                                                        status={
                                                            operation.statusNivel2
                                                        }
                                                    />
                                                </div>

                                            </div>

                                        ) : (

                                            <div className="flex h-[72px] w-[140px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                                                Sin socio
                                            </div>

                                        )}

                                    </td>
                                    {/* NIVEL 3 */}

                                    <td className="px-3 py-3">

                                        {operation.socioNivel3 ? (

                                            <div className="w-[140px] rounded-lg border border-slate-200 bg-slate-50 p-2.5">

                                                <p className="truncate text-[10px] font-medium text-slate-500">
                                                    {operation.socioNivel3}
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {formatCurrency(
                                                        operation.comisionNivel3,
                                                    )}
                                                </p>

                                                <div className="mt-2">
                                                    <StatusBadge
                                                        status={
                                                            operation.statusNivel3
                                                        }
                                                    />
                                                </div>

                                            </div>

                                        ) : (

                                            <div className="flex h-[72px] w-[140px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
                                                Sin socio
                                            </div>

                                        )}

                                    </td>

                                </tr>

                            ),
                        )}

                    </tbody>

                </table>

                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">

                    <p className="text-sm text-slate-500">
                        Página {page} de {totalPages}
                    </p>

                    <div className="flex gap-2">

                        <button
                            disabled={page === 1}
                            onClick={() =>
                                setPage(page - 1)
                            }
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        <button
                            disabled={page === totalPages}
                            onClick={() =>
                                setPage(page + 1)
                            }
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                        >
                            Siguiente
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}