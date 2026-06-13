import {
    useEffect,
    useState,
} from 'react';

import {
    CommissionFilters,
} from '../components/CommissionFilters';

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

    const defaultDates =
        getDefaultDates();

    const [
        filters,
        setFilters,
    ] = useState(
        defaultDates,
    );

    const {
        commissions,
        isLoading,
        fetchCommissions,
    } =
        useMyWeeklyCommissions();

    useEffect(() => {

        void fetchCommissions(
            filters,
        );

    }, []);

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

            <section className="rounded-2xl bg-white p-4 shadow-sm">

                <div className="mb-5">

                    <h2 className="text-lg font-semibold text-slate-900">
                        Semana de comisiones
                    </h2>

                </div>

                <CommissionFilters
                    filters={
                        filters
                    }
                    onChange={
                        setFilters
                    }
                    onSubmit={
                        fetchCommissions
                    }
                    isLoading={
                        isLoading
                    }
                />

            </section>

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
                        operations={
                            commissions.operaciones
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