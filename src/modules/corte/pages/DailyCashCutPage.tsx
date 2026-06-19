// src/modules/corte/pages/DailyCashCutPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type {
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


type ViewMode = 'daily' | 'range';

export default function DailyCashCutPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [fecha, setFecha] = useState(todayISO());
    const [startDate, setStartDate] = useState(todayISO());
    const [endDate, setEndDate] = useState(todayISO());
    const [range, setRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [showRangeCalendar, setShowRangeCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node)
            ) {
                setShowRangeCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const {
        dailyCut,
        rangeCut,
        isLoadingDailyCut,
        isLoadingRangeCut,
        isRegisteringCut,
        fetchDailyCut,
        fetchRangeCut,
        submitRegisterDailyCutByDate,
    } = useDailyCashCut();

    const isDailyMode = viewMode === 'daily';

    const currentData = useMemo<
        DailyCashCutResponse | CashCutRangeResponse | null
    >(() => {
        return isDailyMode ? dailyCut : rangeCut;
    }, [dailyCut, rangeCut, isDailyMode]);

    const isLoading = isDailyMode ? isLoadingDailyCut : isLoadingRangeCut;
    const showLoadingOverlay = isLoading && Boolean(currentData);

    useEffect(() => {
        fetchDailyCut(fecha);
    }, []);

    const handleSearch = async () => {
        if (isDailyMode) {
            await fetchDailyCut(fecha);
            return;
        }

        await fetchRangeCut(startDate, endDate);
    };

    const handleRegisterCut = async () => {
        await submitRegisterDailyCutByDate(fecha);
    };

    const handleRangeSelect = (selectedRange?: DateRange) => {
        setRange(selectedRange);

        if (!selectedRange?.from || !selectedRange?.to) {
            return;
        }

        const start = toISO(selectedRange.from);
        const end = toISO(selectedRange.to);

        setStartDate(start);
        setEndDate(end);

        setShowRangeCalendar(false);

        fetchRangeCut(start, end);
    };

    useEffect(() => {
        if (fecha) {
            handleSearch()
        }
    }, [fecha])


    const title = isDailyMode
        ? `Corte del día ${formatDate(fecha)}`
        : `Corte del ${formatDate(startDate)} al ${formatDate(endDate)}`;

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
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Control de efectivo
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                                    Cortes diarios
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Consulta saldos, entradas, retornos y comisiones de la operación.
                                </p>
                            </div>

                            {/* 
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('daily')}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === 'daily'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    Corte diario
                                </button>

                               <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode('range');

                                        if (range?.from && range?.to) {
                                            fetchRangeCut(
                                                toISO(range.from),
                                                toISO(range.to)
                                            );
                                        }
                                    }}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === 'range'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    Rango de fechas
                                </button> 
                            </div>
                            */}
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                            {isDailyMode ? (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Fecha del corte
                                    </label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(event) => setFecha(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 lg:max-w-xs"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="relative"
                                    ref={calendarRef}
                                >
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Rango de fechas
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setShowRangeCalendar((prev) => !prev)}
                                        className="flex h-11 min-w-[320px] items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                                    >
                                        {range?.from && range?.to
                                            ? `${formatDate(toISO(range.from))} - ${formatDate(toISO(range.to))}`
                                            : 'Seleccionar rango'}
                                    </button>

                                    {showRangeCalendar && (
                                        <div className="absolute left-0 top-14 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                                            <DayPicker
                                                mode="range"
                                                selected={range}
                                                onSelect={handleRangeSelect}
                                                numberOfMonths={2}
                                                pagedNavigation
                                            />
                                        </div>
                                    )}
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

                    {isLoading && !currentData ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                            Calculando corte...
                        </div>
                    ) : null}

                    {!isLoading && !currentData ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                            Selecciona una fecha para consultar el corte.
                        </div>
                    ) : null}

                    {currentData ? (
                        <>
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {title}
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

                                    {/*               <SummaryCard
                label="Movimiento neto"
                value={currentData.totalEntradas - currentData.totalSalidas}
                helper="Entradas menos salidas"
              /> */}
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
                                        }
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