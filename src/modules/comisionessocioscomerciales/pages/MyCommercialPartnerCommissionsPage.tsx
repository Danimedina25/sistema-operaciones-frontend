import { useTableCacheKey } from '@/shared/hooks/use-table-filters';
import { useUrlFilters } from '@/shared/hooks/use-url-filters';
import {
    useEffect, useState,
} from 'react';

import {
    CommissionFilters,
} from '../components/CommissionFilters';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';

import {
    CommissionSummaryCardsSkeleton,
} from '../components/CommissionSummaryCardsSkeleton';

import {
    CommissionOperationsTableSkeleton,
} from '../components/CommissionOperationsTableSkeleton';

import {
    EmptyCommissionsState,
} from '../components/EmptyCommissionsState';


import {
    useMyWeeklyCommissions,
} from '../hooks/use-my-weekly-commissions';
import { MyCommissionsTable } from '../components/MyCommissionsTable';
import { MyCommissionsSummaryCards } from '../components/MyCommissionsSummaryCards';

function getDefaultDates() {

    const today = new Date();

    const currentDay =
        today.getDay();

    const lastSaturday =
        new Date(today);

    lastSaturday.setDate(
        today.getDate()
        - currentDay
        - 1,
    );

    const lastSunday =
        new Date(lastSaturday);

    lastSunday.setDate(
        lastSaturday.getDate()
        - 6,
    );

    const formatDate = (
        date: Date,
    ) =>
        `${date.getFullYear()}-${String(
            date.getMonth() + 1,
        ).padStart(2, '0')}-${String(
            date.getDate(),
        ).padStart(2, '0')}`;

    return {
        startDate:
            formatDate(
                lastSunday,
            ),

        endDate:
            formatDate(
                lastSaturday,
            ),
    };
}

export default function MyCommercialPartnerCommissionsPage() {

    const [defaultDates] = useState(() => ({ ...getDefaultDates(), commissionStatus: 'ALL' }));
    const cacheKey = useTableCacheKey('table-filters:my-commissions');
    const { filters, setFilters } = useUrlFilters(defaultDates, cacheKey);

    const {
        commissions,
        isLoading,
        fetchCommissions,
    } =
        useMyWeeklyCommissions();

    useEffect(() => {

        void fetchCommissions(
            { startDate: filters.startDate, endDate: filters.endDate },
        );

    }, [fetchCommissions, filters.startDate, filters.endDate]);

    return (
        <div className="space-y-3">

            {/* HEADER */}

            <div className="rounded-2xl bg-white p-4 shadow-sm">

                <h1 className="text-lg font-semibold text-slate-900">
                    Mis comisiones
                </h1>

                <p className="text-sm text-slate-500">
                    Consulta tus ganancias
                    generadas y las
                    comisiones de tu red
                    comercial.
                </p>

            </div>

            {/* FILTROS */}

            <TableFilterSection title="Semana de comisiones">
                <CommissionFilters
                    filters={
                        filters
                    }
                    onChange={
                        (dates) => setFilters({ ...filters, ...dates })
                    }
                    onSubmit={
                        fetchCommissions
                    }
                    isLoading={
                        isLoading
                    }
                />
            </TableFilterSection>

            {/* RESUMEN */}

            <section className="rounded-2xl bg-white p-4 shadow-sm">

                <div className="mb-5">

                    <h2 className="text-lg font-semibold text-slate-900">
                        Resumen
                    </h2>

                </div>

                {isLoading
                    || !commissions ? (

                    <CommissionSummaryCardsSkeleton />

                ) : (

                    <MyCommissionsSummaryCards
                        summary={commissions}
                    />

                )}

            </section>

            {/* TABLA */}

            <section className="rounded-2xl bg-white p-4 shadow-sm">

                <div className="mb-5">
                    <label className="mb-2 block text-sm text-slate-600">
                        Estatus de comisión
                        <select
                            className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
                            value={filters.commissionStatus}
                            onChange={(event) => setFilters({ ...filters, commissionStatus: event.target.value })}
                        >
                            <option value="ALL">Todas</option>
                            <option value="GENERADA">Pendientes</option>
                            <option value="PAGADA">Pagadas</option>
                        </select>
                    </label>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Detalle de
                        operaciones
                    </h2>

                </div>

                {isLoading ? (

                    <CommissionOperationsTableSkeleton />

                ) : commissions?.operaciones
                    ?.length ? (

                    <MyCommissionsTable
                        key={`${filters.startDate}:${filters.endDate}:${filters.commissionStatus}`}
                        operations={
                            commissions.operaciones.filter((operation) => filters.commissionStatus === 'ALL' || operation.myCommissionStatus === filters.commissionStatus)
                        }
                    />

                ) : (

                    <EmptyCommissionsState
                        onResetFilters={() =>
                            setFilters(
                                defaultDates,
                            )
                        }
                    />

                )}

            </section>

        </div>
    );
}
