import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Lock } from 'lucide-react';
import { buildOperationDetailPath } from '@/routes/paths';
import { formatBankAccountLabel } from '@/shared/utils/bank-account-label';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { DENOMINATIONS, type CashCounts, type CashDay, type CashLedger, type CashMovement } from '../types/caja-general.types';
import { currency } from '../utils/cash-amounts';
import { formatCashDate, formatCashDateTime, formatCashTime } from '../utils/cash-dates';

/** Entrada, salida o apertura: define color de importe, ícono y barra del desglose. */
type Tone = 'entrada' | 'salida' | 'neutral';

const TONE = {
  entrada: { icon: 'bg-emerald-50 text-emerald-700', amount: 'text-emerald-700', bar: 'bg-emerald-500', sign: '+' },
  salida: { icon: 'bg-red-50 text-red-700', amount: 'text-red-700', bar: 'bg-red-500', sign: '−' },
  neutral: { icon: 'bg-slate-100 text-slate-500', amount: 'text-slate-950', bar: 'bg-slate-400', sign: '' },
} as const;

/**
 * Desglose por denominación. Sólo se listan las denominaciones presentes —capturar once
 * renglones en cero no aporta nada— y la barra muestra el peso de cada una frente a la de
 * mayor subtotal dentro del mismo movimiento.
 */
export function DenominationBreakdown({ counts, tone }: { counts: Partial<CashCounts>; tone: Tone }) {
  const entries = DENOMINATIONS
    .map(([key, cents]) => ({ key, cents, quantity: counts[key] ?? 0 }))
    .filter(entry => entry.quantity > 0)
    .map(entry => ({ ...entry, subtotal: (entry.quantity * entry.cents) / 100 }));

  if (entries.length === 0) return <p className="text-xs text-slate-500">Sin desglose capturado.</p>;

  const largest = Math.max(...entries.map(entry => entry.subtotal));

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map(entry => (
        <li key={entry.key} className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-slate-900">{currency(entry.cents / 100)}</span>
            <span className="text-xs text-slate-500">× {entry.quantity}</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">{currency(entry.subtotal)}</p>
          <div aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${TONE[tone].bar}`} style={{ width: `${(entry.subtotal / largest) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Los movimientos que retiran del banco llevan cuenta bancaria real; los anteriores a la
 * integración sólo conservan el nombre del banco como texto. Las cuentas inactivas se siguen
 * mostrando: el histórico no se reescribe.
 */
function describeAccount(movement: CashMovement): string | null {
  if (movement.cuentaTitular && movement.cuentaBanco && movement.cuentaNumero) {
    const label = formatBankAccountLabel({
      titular: movement.cuentaTitular,
      banco: movement.cuentaBanco,
      numeroCuenta: maskAccountNumber(movement.cuentaNumero),
    });
    return movement.cuentaActiva === false ? `${label} (inactiva)` : label;
  }
  return movement.banco;
}

/** Un renglón del libro: la apertura del día o un movimiento. */
interface LedgerRow {
  key: string;
  title: string;
  time: string;
  tone: Tone;
  amount: number;
  running: number;
  counts: Partial<CashCounts>;
  linked: boolean;
  meta: string | null;
  operacionId: number | null;
  parcialidadId: number | null;
  comprobanteUrl: string | null;
}

function buildRows(day: CashDay, movements: CashMovement[]): LedgerRow[] {
  const opening: LedgerRow = {
    key: `day-${day.id}-opening`,
    title: 'Inicio en caja',
    time: formatCashTime(day.createdAt),
    tone: 'neutral',
    amount: day.saldoInicial,
    running: day.saldoInicial,
    counts: day.apertura,
    linked: false,
    meta: `Abierta por ${day.abiertoPorNombre || `Usuario #${day.abiertoPor}`}`,
    operacionId: null,
    parcialidadId: null,
    comprobanteUrl: null,
  };

  return [opening, ...movements.map(movement => ({
    key: `mov-${movement.id}`,
    title: movement.concepto,
    time: formatCashTime(movement.createdAt),
    tone: (movement.direccion === 'ENTRADA' ? 'entrada' : 'salida') as Tone,
    amount: movement.monto,
    running: movement.saldoAcumulado,
    counts: movement.denominaciones,
    linked: Boolean(movement.parcialidadId),
    meta: [
      `Registro #${movement.id}`,
      formatCashDateTime(movement.createdAt),
      `Usuario #${movement.creadoPor}`,
      describeAccount(movement),
    ].filter(Boolean).join(' · '),
    operacionId: movement.operacionId,
    parcialidadId: movement.parcialidadId,
    comprobanteUrl: movement.comprobanteUrl,
  }))];
}

function LedgerEntry({ row }: { row: LedgerRow }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = TONE[row.tone];
  const Icon = row.tone === 'entrada' ? ArrowUp : row.tone === 'salida' ? ArrowDown : Lock;

  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-950">{row.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
            <span>{row.time}</span>
            {row.linked && <><span aria-hidden>·</span><span>vinculado a operación</span></>}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className={`block text-sm font-semibold tabular-nums ${tone.amount}`}>
            {tone.sign}{currency(row.amount)}
          </span>
          <span className="mt-0.5 block text-xs tabular-nums text-slate-400">saldo {currency(row.running)}</span>
        </span>

        <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={panelId} className="space-y-3 px-4 pb-5 pl-[4.25rem]">
          {row.operacionId && (
            <Link
              to={buildOperationDetailPath(row.operacionId)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver operación #{row.operacionId}
              {row.parcialidadId ? ` · Entrega #${row.parcialidadId}` : ''}
            </Link>
          )}

          {row.comprobanteUrl?.startsWith('https://') && (
            <a className="block text-xs font-medium text-blue-700 underline" target="_blank" rel="noreferrer" href={row.comprobanteUrl}>
              Ver comprobante
            </a>
          )}

          {row.meta && <p className="text-xs text-slate-500">{row.meta}</p>}

          <DenominationBreakdown counts={row.counts} tone={row.tone} />
        </div>
      )}
    </li>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'entrada' | 'salida' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone ? TONE[tone].amount : 'text-slate-950'}`}>{currency(value)}</p>
    </div>
  );
}

export function CashLedgerTable({ ledger, canDelete = false, onDelete }: {
  ledger: CashLedger;
  canDelete?: boolean;
  onDelete?: (day: CashLedger['dias'][number]) => void;
}) {
  if (ledger.dias.length === 0) return <p className="p-6 text-sm text-slate-500">No hay aperturas registradas en este periodo.</p>;

  return <div className="space-y-6">{ledger.dias.map(day => {
    const movements = ledger.movimientos.filter(movement => movement.diaId === day.id);
    // En centavos para no arrastrar el error de coma flotante al sumar importes.
    const incoming = movements.filter(m => m.direccion === 'ENTRADA').reduce((sum, m) => sum + Math.round(m.monto * 100), 0) / 100;
    const outgoing = movements.filter(m => m.direccion === 'SALIDA').reduce((sum, m) => sum + Math.round(m.monto * 100), 0) / 100;

    return (
      <section key={day.id} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-semibold text-slate-950">Corte del día {formatCashDate(day.fecha)}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${day.closedAt ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {day.closedAt ? 'Caja cerrada' : 'Caja abierta'}
            </span>
          </div>
          {canDelete && (
            <button type="button" onClick={() => onDelete?.(day)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
              Eliminar corte
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Entradas del día" value={incoming} tone="entrada" />
          <SummaryCard label="Salidas del día" value={outgoing} tone="salida" />
          <SummaryCard label="Saldo acumulado" value={day.saldoActual} />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ul>
            {buildRows(day, movements).map(row => <LedgerEntry key={row.key} row={row} />)}
          </ul>

          <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3.5">
            <span aria-hidden className="h-9 w-9 shrink-0" />
            <p className="flex-1 text-sm font-semibold text-slate-950">Corte total del día (esperado)</p>
            <p className="text-sm font-semibold tabular-nums text-slate-950">{currency(day.saldoActual)}</p>
          </div>

          {day.closedAt && (
            <div className="space-y-3 border-t border-slate-200 p-5 text-sm">
              <p>
                Saldo contado: <strong>{currency(day.saldoContado ?? 0)}</strong> · Diferencia: <strong>{currency(day.diferencia ?? 0)}</strong>
              </p>
              {day.observacionesCierre && <p className="text-slate-600">{day.observacionesCierre}</p>}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Desglose del cierre</p>
                <DenominationBreakdown counts={day.cierre} tone="neutral" />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  })}</div>;
}
