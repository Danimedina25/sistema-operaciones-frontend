import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import type { CashCounts } from '../types/caja-general.types';
import { countCents, currency, emptyCounts } from '../utils/cash-amounts';
import { CompactDenominationTables } from './CompactDenominationTables';

/**
 * Cajas recibió el efectivo: lo cuenta por denominación y el total debe ser exactamente el
 * monto retirado. Al confirmar entra a la caja de hoy y baja el saldo de la cuenta.
 */
export function ConfirmWithdrawalModal({ withdrawal, onClose, onConfirm }: {
  withdrawal: BankCashWithdrawal | null;
  onClose: () => void;
  onConfirm: (withdrawal: BankCashWithdrawal, denominaciones: CashCounts) => Promise<unknown>;
}) {
  const formId = useId();
  const summaryRef = useRef<HTMLElement>(null);
  const submitting = useRef(false);
  const [counts, setCounts] = useState(emptyCounts);
  const [error, setError] = useState('');
  useEffect(() => { if (error) summaryRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [error]);
  const [busy, setBusy] = useState(false);
  const totalCents = countCents(counts);
  const expectedCents = withdrawal ? Math.round(withdrawal.monto * 100) : 0;
  const matches = Number.isFinite(totalCents) && totalCents === expectedCents;
  const differenceCents = totalCents - expectedCents;
  // Un retiro registrado antes de exigir centavos .00/.50 no se puede contar en billetes y
  // monedas: nunca cuadraría. Se explica en lugar de dejar el botón deshabilitado sin motivo.
  const countable = expectedCents % 50 === 0;

  function close() {
    if (submitting.current) return;
    setCounts(emptyCounts()); setError('');
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!withdrawal || submitting.current) return;
    if (!matches) { setError(`El desglose debe sumar exactamente ${currency(withdrawal.monto)}.`); return; }
    submitting.current = true; setBusy(true);
    setError('');
    try {
      await onConfirm(withdrawal, counts);
      setCounts(emptyCounts());
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      submitting.current = false; setBusy(false);
    }
  }

  return (
    <Modal open={withdrawal !== null} title="Confirmar retiro recibido" onClose={close} variant="light" size="wide" busy={busy}
      footer={<>
        <Button variant="neutral" type="button" disabled={busy} onClick={close}>Cancelar</Button>
        <Button variant="success" type="submit" form={formId} isLoading={busy} disabled={!matches || !countable}>Confirmar entrada a caja</Button>
      </>}>
      {withdrawal ? (
        // flex en pantallas chicas para que el resumen quede fijo arriba de las tablas; grid de dos columnas en lg.
        <form id={formId} onSubmit={submit} className="flex min-w-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.96fr)_minmax(300px,1fr)] lg:items-start">
          <fieldset disabled={busy || !countable} aria-label="Conteo recibido" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Conteo recibido</h3>
            <p className="mb-3 text-sm leading-5 text-slate-500">Cuenta el efectivo recibido de Cuentas y captura sus denominaciones.</p>
            {countable && <CompactDenominationTables value={counts} onChange={value => { setCounts(value); setError(''); }} />}
          </fieldset>
          <FinancialSummaryCard ref={summaryRef} label="Resumen del retiro" className="order-first min-w-0 sm:p-6 lg:order-last"
            context={<>{WITHDRAWAL_METHODS[withdrawal.forma]} · {withdrawal.banco} {maskAccountNumber(withdrawal.cuentaNumero)}<span className="block text-slate-500">{withdrawal.cuentaTitular}</span></>}
            metrics={[{ label: 'Monto retirado', value: currency(withdrawal.monto), tone: 'blue' },
              { label: 'Total contado', value: Number.isFinite(totalCents) ? currency(totalCents / 100) : '—', tone: matches ? 'green' : !Number.isFinite(differenceCents) || differenceCents > 0 ? 'red' : 'amber' }]}
            note={<>Registró {withdrawal.registradoPorNombre}{withdrawal.referencia ? ` · ${withdrawal.referencia}` : ''}. El efectivo entra a Caja General cuando confirmas el conteo.</>}
            errors={[!countable && 'Este retiro no se puede confirmar: sus centavos no se pueden contar en efectivo (la moneda más chica es de $0.50). Recházalo para que Cuentas lo registre de nuevo con el monto que realmente se entregó.', error]}>
            {Number.isFinite(differenceCents) && <div role="status" className={`rounded-xl border px-3 py-3 text-sm ${matches ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : differenceCents > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <div className="flex items-center gap-2">
                {matches && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <strong>{matches ? 'Conteo completo' : differenceCents > 0 ? `Estás capturando ${currency(differenceCents / 100)} de más.` : `Faltan ${currency(-differenceCents / 100)} por capturar.`}</strong>
              </div>
              {!matches && <p className="mt-1">El total contado debe ser igual al monto retirado de <strong className="tabular-nums">{currency(withdrawal.monto)}</strong>.</p>}
            </div>}
          </FinancialSummaryCard>
        </form>
      ) : null}
    </Modal>
  );
}
