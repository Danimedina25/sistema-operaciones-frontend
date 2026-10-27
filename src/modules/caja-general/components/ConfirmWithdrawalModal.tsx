import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
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
        <form id={formId} onSubmit={submit} className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.96fr)_minmax(300px,1fr)] lg:items-start">
          <fieldset disabled={busy || !countable} aria-label="Conteo recibido" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Conteo recibido</h3>
            <p className="mb-3 text-sm leading-5 text-slate-500">Cuenta el efectivo recibido de Cuentas y captura sus denominaciones.</p>
            {countable ? <CompactDenominationTables value={counts} onChange={value => { setCounts(value); setError(''); }} /> :
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Este retiro no se puede confirmar: sus centavos no se pueden contar en efectivo (la moneda más chica es de $0.50). Recházalo para que Cuentas lo registre de nuevo con el monto que realmente se entregó.
              </p>}
          </fieldset>
          <aside ref={summaryRef} aria-label="Resumen del retiro" className="order-first min-w-0 lg:order-last rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-0">
            <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Monto retirado</span><strong className="tabular-nums text-slate-950">{currency(withdrawal.monto)}</strong></div>
            <div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm text-slate-500">Total contado</span><strong className="text-3xl font-bold tabular-nums tracking-tight text-slate-950">{Number.isFinite(totalCents) ? currency(totalCents / 100) : '—'}</strong></div>
            {Number.isFinite(differenceCents) && <div role="status" className={`mt-4 rounded-xl border px-3 py-3 text-sm ${matches ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : differenceCents > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <div className="flex items-center gap-2">
                {matches && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <strong>{matches ? 'Conteo completo' : differenceCents > 0 ? `Estás capturando ${currency(differenceCents / 100)} de más.` : `Faltan ${currency(-differenceCents / 100)} por capturar.`}</strong>
              </div>
              {!matches && <p className="mt-1">El total contado debe ser igual al monto retirado de <strong className="tabular-nums">{currency(withdrawal.monto)}</strong>.</p>}
            </div>}
            {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
              <div><dt className="text-slate-500">Forma</dt><dd className="font-semibold text-slate-900">{WITHDRAWAL_METHODS[withdrawal.forma]}</dd></div>
              <div><dt className="text-slate-500">Cuenta origen</dt><dd className="font-semibold text-slate-900">{withdrawal.banco} {maskAccountNumber(withdrawal.cuentaNumero)}<span className="block font-normal text-slate-500">{withdrawal.cuentaTitular}</span></dd></div>
              <div><dt className="text-slate-500">Registró</dt><dd className="font-semibold text-slate-900">{withdrawal.registradoPorNombre}{withdrawal.referencia ? <span className="block font-normal text-slate-500">{withdrawal.referencia}</span> : null}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">El efectivo entra a Caja General cuando confirmas el conteo.</p>
          </aside>
        </form>
      ) : null}
    </Modal>
  );
}
