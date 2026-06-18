// src/modules/corte/pages/DailyCashCutPage.tsx

import { useEffect, useMemo, useState } from 'react';

import type {
  CashCutRangeResponse,
  DailyCashCutResponse,
} from '@/modules/corte/types/corte.types';
import { useDailyCashCut } from '../hooks/use-daily-cash-cut';
import { formatDate } from '@/modules/operations/utils/operation-formatters';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

  const title = isDailyMode
    ? `Corte del día ${formatDate(fecha)}`
    : `Corte del ${formatDate(startDate)} al ${formatDate(endDate)}`;

  return (
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

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Corte diario
            </button>

            <button
              type="button"
              onClick={() => setViewMode('range')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === 'range'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Rango de fechas
            </button>
          </div>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Consultando...' : 'Consultar'}
            </button>

            {isDailyMode ? (
              <button
                type="button"
                onClick={handleRegisterCut}
                disabled={isRegisteringCut}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegisteringCut ? 'Registrando...' : 'Registrar corte'}
              </button>
            ) : null}
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
                label={'Saldo final'}
                value={currentData.saldoFinal}
                helper={
                  isDailyMode && !dailyCut?.registrado
                    ? 'Calculado hasta este momento'
                    : 'Saldo final del periodo'
                }
                strong
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
              description="Pagos de ingreso validados"
              totalLabel="Total entradas"
              total={currentData.totalEntradas}
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
              description="Retornos y comisiones pagadas"
              totalLabel="Total salidas"
              total={currentData.totalSalidas}
              rows={[
                {
                  label: 'Retornos por transferencia',
                  value: currentData.retornosTransferencia,
                },
                {
                  label: 'Retornos por depósito',
                  value: currentData.retornosDeposito,
                },
                {
                  label: 'Retornos en efectivo',
                  value: currentData.retornosEfectivo,
                },
                {
                  label: 'Comisiones socios comerciales',
                  value: currentData.totalComisionesSocios,
                },
                {
                  label: 'Comisiones oficina',
                  value: currentData.totalComisionesOficina,
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
                    label="Total retornos"
                    value={currentData.totalRetornos}
                  />
                  <SummaryRow
                    label="Total comisiones socios"
                    value={currentData.totalComisionesSocios}
                  />
                  <SummaryRow
                    label="Total comisiones oficina"
                    value={currentData.totalComisionesOficina}
                  />
                  <SummaryRow
                    label="Total salidas"
                    value={currentData.totalSalidas}
                  />
                  <SummaryRow
                    label={isDailyMode ? 'Saldo actual / final' : 'Saldo final'}
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
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  helper?: string;
  strong?: boolean;
}

function SummaryCard({ label, value, helper, strong }: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        strong
          ? 'border-slate-300 bg-slate-900 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-900'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          strong ? 'text-slate-200' : 'text-slate-500'
        }`}
      >
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold">
        {formatCurrency(value)}
      </p>

      {helper ? (
        <p
          className={`mt-2 text-xs ${
            strong ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

interface BreakdownRow {
  label: string;
  value: number;
}

interface BreakdownCardProps {
  title: string;
  description: string;
  rows: BreakdownRow[];
  totalLabel: string;
  total: number;
}

function BreakdownCard({
  title,
  description,
  rows,
  totalLabel,
  total,
}: BreakdownCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-medium text-slate-500">
            {totalLabel}
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-600">
              {row.label}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(row.value)}
            </span>
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
}

function SummaryRow({ label, value, strong }: SummaryRowProps) {
  return (
    <tr className={strong ? 'bg-slate-50' : undefined}>
      <td className="px-4 py-3 text-slate-600">{label}</td>
      <td
        className={`px-4 py-3 text-right ${
          strong
            ? 'font-semibold text-slate-900'
            : 'font-medium text-slate-800'
        }`}
      >
        {formatCurrency(value)}
      </td>
    </tr>
  );
}