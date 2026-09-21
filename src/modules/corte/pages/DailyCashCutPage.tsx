import { useTableFilters } from '@/shared/hooks/use-table-filters';
// src/modules/corte/pages/DailyCashCutPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
    BankGroupBalanceResponse,
    CashCutRangeResponse,
    DailyCashCutResponse,
} from '@/modules/corte/types/corte.types';
import { useDailyCashCut } from '../hooks/use-daily-cash-cut';
import { formatDate } from '@/modules/operations/utils/operation-formatters';
import { formatDate as toISODate } from '@/shared/utils/weeks';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { paths } from '@/routes/paths';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { PeriodDateField, PeriodModeToggle } from '@/shared/components/ui/PeriodFilter';
import { BankMovementsSection } from '../components/BankMovementsSection';
import { ArrowDownToLine, ArrowUpFromLine, Building2, CalendarDays, Landmark, LoaderCircle, Scale, Search } from 'lucide-react';

function todayISO() {
    return toISODate(new Date());
}

function formatCurrency(value?: number | null) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(value ?? 0);
}


type MainView = 'cashCuts' | 'bankBalances' | 'bankMovements';
type DateMode = 'daily' | 'range';

/**
 * Cada pestaña tiene su propia URL, así se puede enlazar y recargar sin perderla.
 *
 * La pestaña activa se DERIVA de la ruta en lugar de guardarse en estado: navegar
 * remonta la página, y un estado local se reiniciaría en cada cambio de pestaña. Las
 * fechas sobreviven al remonte porque `useTableFilters` las persiste.
 */
const VIEW_PATHS: Record<MainView, string> = {
    cashCuts: paths.corte,
    bankBalances: paths.bankBalances,
    bankMovements: paths.bankMovements,
};

const VIEW_BY_PATH: Record<string, MainView> = {
    [paths.corte]: 'cashCuts',
    [paths.bankBalances]: 'bankBalances',
    [paths.bankMovements]: 'bankMovements',
};

export default function DailyCashCutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const mainView: MainView = VIEW_BY_PATH[location.pathname] ?? 'cashCuts';

    const selectView = (next: MainView) => {
        if (VIEW_PATHS[next] !== location.pathname) {
            navigate(VIEW_PATHS[next]);
        }
    };
    const { filters, setFilters } = useTableFilters('table-filters:daily-cash-cut', {
        dateMode: 'daily' as DateMode,
        fecha: todayISO(),
        startDate: todayISO(),
        endDate: todayISO(),
        bankSearch: '',
    });
    const { dateMode, fecha, startDate, endDate, bankSearch } = filters;
    const setDateMode = (dateMode: DateMode) => setFilters((current) => ({ ...current, dateMode }));
    const setFecha = (fecha: string) => setFilters((current) => ({ ...current, fecha }));
    const setBankSearch = (bankSearch: string) => setFilters((current) => ({ ...current, bankSearch }));

    const {
        dailyCut,
        rangeCut,
        isLoadingDailyCut,
        isLoadingRangeCut,
        isRegisteringCut,
        fetchDailyCut,
        fetchRangeCut,
        submitRegisterDailyCutByDate,
        bankBalancesGrouped,
        isLoadingBankBalances,
        fetchBankBalancesGrouped,
    } = useDailyCashCut();

    const isCashCutsView = mainView === 'cashCuts';
    const isBankBalancesView = mainView === 'bankBalances';
    const isBankMovementsView = mainView === 'bankMovements';
    const isDailyMode = dateMode === 'daily';
    const isRangeMode = dateMode === 'range';

    const currentData = useMemo<
        DailyCashCutResponse | CashCutRangeResponse | null
    >(() => {
        if (!isCashCutsView) {
            return null;
        }

        return isDailyMode ? dailyCut : rangeCut;
    }, [dailyCut, rangeCut, isCashCutsView, isDailyMode]);

    const isLoading = isBankMovementsView
        ? false
        : isCashCutsView
            ? isDailyMode
                ? isLoadingDailyCut
                : isLoadingRangeCut
            : isLoadingBankBalances;
    const showLoadingOverlay = isLoading && Boolean(currentData);

    const handleSearch = async () => {
        if (isBankMovementsView) {
            return;
        }

        if (isBankBalancesView) {
            await fetchBankBalancesGrouped(fecha);
            return;
        }

        if (isDailyMode) {
            await fetchDailyCut(fecha);
            return;
        }

        await fetchRangeCut(startDate, endDate);
    };

    useEffect(() => {
        // El libro de movimientos consulta por su cuenta; no hay corte ni saldos que pedir.
        if (mainView === 'bankMovements') {
            return;
        }

        if (mainView === 'bankBalances') {
            fetchBankBalancesGrouped(fecha);
            return;
        }

        if (dateMode === 'daily') {
            fetchDailyCut(fecha);
            return;
        }

        fetchRangeCut(startDate, endDate);
    }, [fecha, mainView, dateMode, startDate, endDate]);


    const cashCutTitle = isDailyMode
        ? `Corte del día ${formatDate(fecha)}`
        : `Corte del ${formatDate(startDate)} al ${formatDate(endDate)}`;

    const bankBalanceTitle = isDailyMode
        ? `Saldos bancarios del ${formatDate(fecha)}`
        : `Saldos bancarios del ${formatDate(startDate)} al ${formatDate(endDate)}`;

    const pageTitle = {
        cashCuts: 'Cortes diarios',
        bankBalances: 'Saldos bancarios',
        bankMovements: 'Movimientos bancarios',
    }[mainView];

    const pageDescription = {
        cashCuts: 'Consulta saldos, entradas y salidas de dinero en las operaciones.',
        bankBalances: 'Consulta los saldos de las cuentas bancarias agrupadas por banco.',
        bankMovements: 'Consulta del movimiento de las cuentas bancarias: pagos validados, retornos completados y cheques cobrados en Caja General.',
    }[mainView];

    return (

        <div className="relative mx-auto max-w-[1600px]">
            {showLoadingOverlay ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-7 py-6 text-white shadow-2xl">
                        <LoaderCircle className="h-8 w-8 animate-spin text-blue-400" />
                        <p className="text-sm font-semibold text-slate-200">
                            Calculando corte...
                        </p>
                    </div>
                </div>
            ) : null}

            <div className={`space-y-6 ${showLoadingOverlay ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                        <div className="grid gap-2 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => selectView('cashCuts')}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mainView === 'cashCuts'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                Corte
                            </button>

                            <button
                                type="button"
                                onClick={() => selectView('bankBalances')}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mainView === 'bankBalances'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                Saldos bancarios
                            </button>

                            <button
                                type="button"
                                onClick={() => selectView('bankMovements')}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mainView === 'bankMovements'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                Movimientos bancarios
                            </button>
                        </div>
                    </section>
                    <PageHeader
                        title={pageTitle}
                        description={pageDescription}
                        actions={isBankBalancesView ? null : (
                            <PeriodModeToggle mode={dateMode} onChange={setDateMode} />
                        )}
                    />

                    <PeriodDateField
                        id="corte-fecha"
                        mode={isBankBalancesView ? 'daily' : dateMode}
                        dailyLabel={isBankBalancesView
                            ? 'Fecha de saldos'
                            : isBankMovementsView
                                ? 'Fecha de movimientos'
                                : 'Fecha del corte'}
                        fecha={fecha}
                        startDate={startDate}
                        endDate={endDate}
                        /* No hay movimientos por venir; el corte sí admite consultar cualquier fecha. */
                        maxDate={isBankMovementsView ? todayISO() : undefined}
                        onFechaChange={setFecha}
                        onRangeChange={({ startDate: start, endDate: end }) => {
                            setFilters((current) => ({ ...current, startDate: start, endDate: end }));
                            fetchRangeCut(start, end);
                        }}
                    />


                    {isBankMovementsView ? (
                        <BankMovementsSection
                            desde={isDailyMode ? fecha : startDate}
                            hasta={isDailyMode ? fecha : endDate}
                        />
                    ) : null}

                    {isBankBalancesView ? (
                        <BankBalancesSection
                            groups={bankBalancesGrouped}
                            isLoading={isLoadingBankBalances}
                            title={bankBalanceTitle}
                            search={bankSearch}
                            onSearchChange={setBankSearch}
                        />
                    ) : null}
                    {isCashCutsView && isLoading && !currentData ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                            Calculando corte...
                        </div>
                    ) : null}

                    {isCashCutsView && !isLoading && !currentData ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                            Selecciona una fecha para consultar el corte.
                        </div>
                    ) : null}

                    {isCashCutsView && currentData ? (
                        <>
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300"><CalendarDays className="h-4 w-4" /> Resumen del periodo</p>
                                        <h2 className="mt-1 text-xl font-bold text-white">
                                            {cashCutTitle}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {isDailyMode
                                                ? dailyCut?.registrado
                                                    ? 'Corte registrado en sistema.'
                                                    : 'Corte calculado en vivo, aún no registrado.'
                                                : rangeCut?.incluyeDiaActualEnVivo
                                                    ? 'Este rango incluye información del día actual en vivo.'
                                                    : 'Resumen calculado con cortes registrados.'}
                                        </p>
                                    </div>

                                    {/* {isDailyMode ? (
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    dailyCut?.registrado
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {dailyCut?.registrado ? 'Registrado' : 'En vivo'}
                </span>
              ) : null} */}
                                </div></div>

                                <div className="grid gap-4 p-6 md:grid-cols-3">
                                    <SummaryCard
                                        label="Saldo inicial"
                                        value={currentData.saldoInicial}
                                        helper="Saldo tomado del corte anterior"
                                    />

                                    <SummaryCard
                                        label="Saldo final"
                                        value={currentData.saldoFinal}
                                        helper={
                                            isDailyMode && !dailyCut?.registrado
                                                ? 'Calculado hasta este momento'
                                                : 'Saldo final del periodo'
                                        }
                                        variant="dark"
                                    />

                                    <SummaryCard
                                        label="Ganancias oficina"
                                        value={currentData.totalComisionesOficina}
                                        helper={
                                            isDailyMode && !dailyCut?.registrado
                                                ? 'Calculado hasta este momento'
                                                : 'Saldo final del periodo'
                                        }
                                        variant="success"
                                    />
                                </div>

                            </section>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <BreakdownCard
                                    title="Entradas"
                                    description="Dinero que entra a las cuentas bancarias por pagos validados. La comisión de oficina está incluida. El efectivo se lleva en Caja General."
                                    totalLabel="Total entradas"
                                    total={currentData.totalEntradas}
                                    highlight="positive"
                                    rows={[
                                        {
                                            label: 'Transferencia',
                                            value: currentData.entradasTransferencia,
                                        },
                                        {
                                            label: 'Depósito',
                                            value: currentData.entradasDeposito,
                                        },
                                        {
                                            label: 'Cheque',
                                            value: currentData.entradasCheque,
                                        },
                                    ]}
                                />

                                <BreakdownCard
                                    title="Salidas"
                                    description="Dinero que sale de las cuentas bancarias: retornos a clientes, comisiones de socios y el efectivo retirado hacia Caja General. Los retornos en efectivo salen de Caja General."
                                    totalLabel="Total salidas"
                                    total={currentData.totalSalidas}
                                    highlight="negative"
                                    rows={[
                                        {
                                            label: 'Retornos a clientes por transferencia',
                                            value: currentData.retornosTransferencia,
                                        },
                                        {
                                            label: 'Retornos a clientes por depósito',
                                            value: currentData.retornosDeposito,
                                        },
                                        {
                                            label: 'Retornos a clientes por cheque',
                                            value: currentData.retornosCheque,
                                        },
                                        {
                                            label: 'Retornos a clientes por retiro sin tarjeta',
                                            value: currentData.retornosRetiroSinTarjeta,
                                        },
                                        {
                                            label: 'Efectivo retirado hacia Caja General',
                                            value: currentData.salidasCajaGeneral,
                                        },
                                        {
                                            label: 'Pago de comisiones a socios comerciales',
                                            value: currentData.totalComisionesSocios,
                                        },
                                    ]}
                                />
                            </div>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="flex items-center gap-2 bg-slate-900 px-5 py-4 text-white"><Scale className="h-4 w-4 text-blue-300" /><h3 className="text-sm font-bold">
                                    Resumen operativo
                                </h3></div>

                                <div className="m-5 overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            <SummaryRow
                                                label="Saldo inicial"
                                                value={currentData.saldoInicial}
                                            />

                                            <SummaryRow
                                                label="Total entradas"
                                                value={currentData.totalEntradas}
                                            />

                                            <SummaryRow
                                                label="Total salidas"
                                                value={currentData.totalSalidas}
                                                strong
                                            />

                                            <SummaryRow
                                                label="Retornos a clientes"
                                                value={currentData.totalRetornos}
                                                variant="child"
                                            />

                                            <SummaryRow
                                                label="Comisiones a socios comerciales"
                                                value={currentData.totalComisionesSocios}
                                                variant="child"
                                            />

                                            <SummaryRow
                                                label="Saldo final"
                                                value={currentData.saldoFinal}
                                                strong
                                            />
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

interface SummaryCardProps {
    label: string;
    value: number;
    helper?: string;
    variant?: 'default' | 'dark' | 'success';
}

function SummaryCard({
    label,
    value,
    helper,
    variant = 'default',
}: SummaryCardProps) {
    const cardStyles = {
        default: 'border-slate-200 bg-slate-50 text-slate-900',
        dark: 'border-slate-300 bg-slate-900 text-white',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }[variant];

    const labelStyles = {
        default: 'text-slate-500',
        dark: 'text-slate-200',
        success: 'text-emerald-700',
    }[variant];

    const helperStyles = {
        default: 'text-slate-500',
        dark: 'text-slate-300',
        success: 'text-emerald-700',
    }[variant];

    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${cardStyles}`}>
            <p className={`text-xs font-bold uppercase tracking-[0.1em] ${labelStyles}`}>
                {label}
            </p>

            <p className="mt-3 text-2xl font-bold tabular-nums">
                {formatCurrency(value)}
            </p>

            {helper ? (
                <p className={`mt-2 text-xs ${helperStyles}`}>
                    {helper}
                </p>
            ) : null}
        </div>
    );
}

interface BreakdownRow {
    label: string;
    value: number;
    helper?: string;
}

interface BreakdownCardProps {
    title: string;
    description: string;
    rows: BreakdownRow[];
    totalLabel: string;
    total: number;
    highlight?: 'positive' | 'negative' | 'neutral';
}

function BreakdownCard({
    title,
    description,
    rows,
    totalLabel,
    total,
    highlight = 'neutral',
}: BreakdownCardProps) {
    const totalStyles =
        highlight === 'positive'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : highlight === 'negative'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-slate-200 bg-slate-50 text-slate-900';

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className={`h-1 ${highlight === 'positive' ? 'bg-emerald-500' : highlight === 'negative' ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <div className="p-5">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        {highlight === 'positive' ? <ArrowDownToLine className="h-5 w-5 text-emerald-600" /> : <ArrowUpFromLine className="h-5 w-5 text-rose-600" />}
                        {title}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-slate-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`min-w-[180px] rounded-2xl border px-4 py-3 text-right ${totalStyles}`}
                >
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                        {totalLabel}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                        {formatCurrency(total)}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-slate-600">
                                {row.label}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-slate-900">
                                {formatCurrency(row.value)}
                            </span>
                        </div>

                        {row.helper ? (
                            <p className="mt-1 text-xs text-slate-500">
                                {row.helper}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div></div>
        </section>
    );
}

interface SummaryRowProps {
    label: string;
    value: number;
    strong?: boolean;
    variant?: 'default' | 'child';
}

function SummaryRow({
    label,
    value,
    strong,
    variant = 'default',
}: SummaryRowProps) {
    const isChild = variant === 'child';

    return (
        <tr className={strong ? 'bg-slate-50' : undefined}>
            <td
                className={`px-4 py-3 ${isChild
                    ? 'pl-8 text-xs text-slate-500'
                    : 'text-slate-600'
                    }`}
            >
                {isChild ? `↳ ${label}` : label}
            </td>

            <td
                className={`px-4 py-3 text-right ${strong
                    ? 'font-semibold text-slate-900'
                    : isChild
                        ? 'text-xs font-medium text-slate-500'
                        : 'font-medium text-slate-800'
                    }`}
            >
                {formatCurrency(value)}
            </td>
        </tr>
    );
}

interface BankBalancesSectionProps {
    groups: BankGroupBalanceResponse[];
    isLoading: boolean;
    title: string;
    search: string;
    onSearchChange: (value: string) => void;
}

function BankBalancesSection({
    groups = [],
    isLoading,
    title,
    search,
    onSearchChange,
}: BankBalancesSectionProps) {
    const safeGroups = Array.isArray(groups) ? groups : [];

    const totalGeneral = safeGroups.reduce(
        (total, group) => total + (group.saldoTotalBanco ?? 0),
        0,
    );

    const normalizedSearch = search.trim().toLowerCase();
    const isSearching = normalizedSearch.length > 0;

    const filteredGroups = isSearching
        ? safeGroups
            .map((group) => ({
                ...group,
                cuentas: group.cuentas.filter((account) =>
                    account.titular?.toLowerCase().includes(normalizedSearch)
                    || group.banco?.toLowerCase().includes(normalizedSearch),
                ),
            }))
            .filter((group) => group.cuentas.length > 0)
        : safeGroups;

    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex flex-col gap-3 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300"><Landmark className="h-4 w-4" /> Posición bancaria</p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Consulta el saldo total agrupado por banco y el detalle de cada cuenta bancaria.
                    </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Saldo total bancario
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-white">
                        {formatCurrency(totalGeneral)}
                    </p>
                </div>
            </div>

            <div className="border-b border-slate-100 p-5">
                <div className="relative max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Buscar por nombre de cuenta o banco..."
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                </div>
            </div>

            {!isLoading && filteredGroups.length === 0 ? (
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                    {isSearching
                        ? 'No se encontraron cuentas que coincidan con la búsqueda.'
                        : 'No hay saldos bancarios disponibles para esta fecha.'}
                </div>
            ) : null}

            {!isLoading && filteredGroups.length > 0 ? (
                <div className="space-y-3 p-5">
                    {filteredGroups.map((group) => (
                        <BankGroupAccordion
                            key={group.banco}
                            group={group}
                            defaultOpen={isSearching}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

interface BankGroupAccordionProps {
    group: BankGroupBalanceResponse;
    defaultOpen?: boolean;
}

function BankGroupAccordion({
    group,
    defaultOpen = false,
}: BankGroupAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        if (defaultOpen) {
            setIsOpen(true);
        }
    }, [defaultOpen]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 bg-slate-100 px-4 py-4 text-left transition hover:bg-slate-200/70"
            >
                <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><Building2 className="h-4 w-4 text-blue-600" />
                        {group.banco}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {group.totalCuentas} cuenta{group.totalCuentas === 1 ? '' : 's'} bancaria{group.totalCuentas === 1 ? '' : 's'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-medium text-slate-500">
                            Saldo banco
                        </p>
                        <p className="text-base font-bold tabular-nums text-slate-900">
                            {formatCurrency(group.saldoTotalBanco)}
                        </p>
                    </div>

                    <span className="text-lg text-slate-500">
                        {isOpen ? '−' : '+'}
                    </span>
                </div>
            </button>

            {isOpen ? (
                <div className="divide-y divide-slate-100 bg-white">
                    {group.cuentas.map((account) => (
                        <div
                            key={account.bankAccountId}
                            className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {account.titular}
                                </p>

                                <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:gap-4">
                                    <span>
                                        Cuenta: {maskAccountNumber(account.numeroCuenta)}
                                    </span>
                                    <span>
                                        CLABE: {maskAccountNumber(account.clabe)}
                                    </span>
                                </div>
                            </div>

                            <div className="text-left md:text-right">
                                <p className="text-xs font-medium text-slate-500">
                                    Saldo
                                </p>
                                <p
                                    className={`text-base font-bold ${account.saldoFinal < 0
                                        ? 'text-red-700'
                                        : 'text-slate-900'
                                        }`}
                                >
                                    {formatCurrency(account.saldoFinal)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

