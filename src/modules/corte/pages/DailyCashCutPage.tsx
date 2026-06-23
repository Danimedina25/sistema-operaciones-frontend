// src/modules/corte/pages/DailyCashCutPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import type {
    BankGroupBalanceResponse,
    CashCutRangeResponse,
    DailyCashCutResponse,
} from '@/modules/corte/types/corte.types';
import { useDailyCashCut } from '../hooks/use-daily-cash-cut';
import { formatDate } from '@/modules/operations/utils/operation-formatters';

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function toISO(date?: Date) {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatCurrency(value?: number | null) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(value ?? 0);
}


type MainView = 'cashCuts' | 'bankBalances';
type DateMode = 'daily' | 'range';

export default function DailyCashCutPage() {
    const [mainView, setMainView] = useState<MainView>('cashCuts');
    const [dateMode, setDateMode] = useState<DateMode>('daily');
    const [fecha, setFecha] = useState(todayISO());
    const [startDate, setStartDate] = useState(todayISO());
    const [endDate, setEndDate] = useState(todayISO());
    const [range, setRange] = useState({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection' as const,
    });
    const [showRangeCalendar, setShowRangeCalendar] = useState(false);

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

    const isLoading = isCashCutsView
        ? isDailyMode
            ? isLoadingDailyCut
            : isLoadingRangeCut
        : isLoadingBankBalances;
    const showLoadingOverlay = isLoading && Boolean(currentData);

    const handleSearch = async () => {
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

    useEffect(() => {
        console.log('bankBalancesGrouped', bankBalancesGrouped);
    }, [bankBalancesGrouped]);


    const cashCutTitle = isDailyMode
        ? `Corte del día ${formatDate(fecha)}`
        : `Corte del ${formatDate(startDate)} al ${formatDate(endDate)}`;

    const bankBalanceTitle = isDailyMode
        ? `Saldos bancarios del ${formatDate(fecha)}`
        : `Saldos bancarios del ${formatDate(startDate)} al ${formatDate(endDate)}`;

    const pageTitle =
        mainView === 'cashCuts'
            ? 'Cortes diarios'
            : 'Saldos bancarios';

    const pageDescription =
        mainView === 'cashCuts'
            ? 'Consulta saldos, entradas y salidas de dinero en las operaciones.'
            : 'Consulta los saldos de las cuentas bancarias agrupadas por banco.';

    return (

        <div className="relative">
            {showLoadingOverlay ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-xl">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                        <p className="text-sm font-medium text-slate-700">
                            Calculando corte...
                        </p>
                    </div>
                </div>
            ) : null}

            <div className={`space-y-6 ${showLoadingOverlay ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setMainView('cashCuts')}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mainView === 'cashCuts'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                Corte
                            </button>

                            <button
                                type="button"
                                onClick={() => setMainView('bankBalances')}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mainView === 'bankBalances'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                Saldos bancarios
                            </button>
                        </div>
                    </section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Cortes y saldos
                                </p>

                                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                                    {pageTitle}
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    {pageDescription}
                                </p>
                            </div>
                            {isCashCutsView ? (
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setDateMode('daily')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${dateMode === 'daily'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Día
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDateMode('range')}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${dateMode === 'range'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        Rango de fechas
                                    </button>
                                </div>
                            ) : null}

                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                            {isBankBalancesView || isDailyMode ? (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        {isBankBalancesView ? 'Fecha de saldos' : 'Fecha del corte'}
                                    </label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(event) => setFecha(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 lg:max-w-xs"
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Rango de fechas
                                    </label>

                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowRangeCalendar(true)}
                                            className="flex h-11 min-w-[320px] items-center rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm"
                                        >
                                            {`${formatDate(startDate)} - ${formatDate(endDate)}`}
                                        </button>

                                        {showRangeCalendar && (
                                            <div className="absolute left-0 top-14 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                                                <DateRange
                                                    ranges={[range]}
                                                    showMonthArrow={true}
                                                    moveRangeOnFirstSelection={false}
                                                    editableDateInputs={false}
                                                    showDateDisplay={false}
                                                    showMonthAndYearPickers={true}
                                                    rangeColors={['#0f172a']}
                                                    months={1}
                                                    direction="horizontal"
                                                    onChange={(item: any) => {
                                                        const selection = item.selection;

                                                        setRange(selection);

                                                        if (!selection.startDate || !selection.endDate) {
                                                            return;
                                                        }

                                                        // Solo consulta cuando el usuario terminó de seleccionar
                                                        if (item.selection.startDate === item.selection.endDate) {
                                                            return;
                                                        }

                                                        const start = toISO(selection.startDate);
                                                        const end = toISO(selection.endDate);

                                                        setStartDate(start);
                                                        setEndDate(end);

                                                        fetchRangeCut(start, end);

                                                        setShowRangeCalendar(false);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row">
                                {/*  <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? 'Consultando...' : 'Consultar'}
                        </button>
 */}
                                {/* {isDailyMode ? (
                                    <button
                                        type="button"
                                        onClick={handleRegisterCut}
                                        disabled={isRegisteringCut}
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isRegisteringCut ? 'Registrando...' : 'Registrar corte'}
                                    </button>
                                ) : null} */}
                            </div>
                        </div>
                    </section>

                    {isBankBalancesView ? (
                        <BankBalancesSection
                            groups={bankBalancesGrouped}
                            isLoading={isLoadingBankBalances}
                            title={bankBalanceTitle}
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
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {cashCutTitle}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
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
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                                    description="Pagos de ingreso validados. La comisión de oficina está incluida dentro de estas entradas."
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
                                            label: 'Efectivo',
                                            value: currentData.entradasEfectivo,
                                        },
                                    ]}
                                />

                                <BreakdownCard
                                    title="Salidas"
                                    description="Dinero pagado por retornos a clientes y/o comisiones de socios comerciales."
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
                                            label: 'Retornos a clientes en efectivo',
                                            value: currentData.retornosEfectivo,
                                        },
                                        {
                                            label: 'Pago de comisiones a socios comerciales',
                                            value: currentData.totalComisionesSocios,
                                        },
                                    ]}
                                />
                            </div>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Resumen operativo
                                </h3>

                                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
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
        <div className={`rounded-2xl border p-5 ${cardStyles}`}>
            <p className={`text-sm font-medium ${labelStyles}`}>
                {label}
            </p>

            <p className="mt-3 text-2xl font-semibold">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
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
                    <p className="mt-1 text-xl font-bold">
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
                            <span className="text-sm font-semibold text-slate-900">
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
            </div>
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
}

function BankBalancesSection({
    groups = [],
    isLoading,
    title
}: BankBalancesSectionProps) {
    const safeGroups = Array.isArray(groups) ? groups : [];

    const totalGeneral = safeGroups.reduce(
        (total, group) => total + (group.saldoTotalBanco ?? 0),
        0,
    );

    return (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Consulta el saldo total agrupado por banco y el detalle de cada cuenta bancaria.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Saldo total bancario
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                        {formatCurrency(totalGeneral)}
                    </p>
                </div>
            </div>

            {!isLoading && safeGroups.length === 0 ? (
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                    No hay saldos bancarios disponibles para esta fecha.
                </div>
            ) : null}

            {!isLoading && safeGroups.length > 0 ? (
                <div className="mt-5 space-y-3">
                    {safeGroups.map((group) => (
                        <BankGroupAccordion
                            key={group.banco}
                            group={group}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}

interface BankGroupAccordionProps {
    group: BankGroupBalanceResponse;
}

function BankGroupAccordion({
    group,
}: BankGroupAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
            >
                <div>
                    <p className="text-sm font-semibold text-slate-900">
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
                        <p className="text-base font-bold text-slate-900">
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
                                        Cuenta: {maskAccount(account.numeroCuenta)}
                                    </span>
                                    <span>
                                        CLABE: {maskAccount(account.clabe)}
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

function maskAccount(value?: string | null) {
    if (!value) return '—';

    const cleanValue = value.trim();

    if (cleanValue.length <= 4) {
        return cleanValue;
    }

    return `****${cleanValue.slice(-4)}`;
}