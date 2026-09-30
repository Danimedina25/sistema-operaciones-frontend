import { useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import type { CashCounts } from '../types/caja-general.types';
import { countCents, currency, emptyCounts } from '../utils/cash-amounts';
import { DenominationFields } from './DenominationFields';

/**
 * Cajas recibió el efectivo: lo cuenta por denominación y el total debe ser exactamente el
 * monto retirado. Al confirmar entra a la caja de hoy y baja el saldo de la cuenta.
 */
export function ConfirmWithdrawalModal({ withdrawal, onClose, onConfirm }: {
  withdrawal: BankCashWithdrawal | null;
  onClose: () => void;
  onConfirm: (withdrawal: BankCashWithdrawal, denominaciones: CashCounts) => Promise<unknown>;
}) {
  const [counts, setCounts] = useState(emptyCounts);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const totalCents = countCents(counts);
  const expectedCents = withdrawal ? Math.round(withdrawal.monto * 100) : 0;
  const matches = Number.isFinite(totalCents) && totalCents === expectedCents;
  // Un retiro registrado antes de exigir centavos .00/.50 no se puede contar en billetes y
  // monedas: nunca cuadraría. Se explica en lugar de dejar el botón deshabilitado sin motivo.
  const countable = expectedCents % 50 === 0;

  function close() {
    if (busy) return;
    setCounts(emptyCounts()); setError('');
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!withdrawal) return;
    if (!matches) { setError(`El desglose debe sumar exactamente ${currency(withdrawal.monto)}.`); return; }
    setBusy(true);
    setError('');
    try {
      await onConfirm(withdrawal, counts);
      setCounts(emptyCounts());
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={withdrawal !== null} title="Confirmar retiro recibido" onClose={close}>
      {withdrawal ? (
        <form onSubmit={submit} className="space-y-5">
          <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs text-slate-500">Monto retirado</dt><dd className="text-lg font-bold tabular-nums text-slate-950">{currency(withdrawal.monto)}</dd></div>
            <div><dt className="text-xs text-slate-500">Forma</dt><dd className="font-semibold text-slate-900">{withdrawal.formaEtiqueta}</dd></div>
            <div><dt className="text-xs text-slate-500">Cuenta</dt><dd className="font-semibold text-slate-900">{withdrawal.banco} {maskAccountNumber(withdrawal.cuentaNumero)}<span className="block text-xs font-normal text-slate-500">{withdrawal.cuentaTitular}</span></dd></div>
            <div><dt className="text-xs text-slate-500">Registró</dt><dd className="font-semibold text-slate-900">{withdrawal.registradoPorNombre}{withdrawal.referencia ? <span className="block text-xs font-normal text-slate-500">{withdrawal.referencia}</span> : null}</dd></div>
          </dl>
          {countable ? (
            <fieldset disabled={busy}>
              <DenominationFields value={counts} onChange={setCounts} />
            </fieldset>
          ) : (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Este retiro no se puede confirmar: sus centavos no se pueden contar en efectivo (la moneda más chica es de
              $0.50). Recházalo para que Cuentas lo registre de nuevo con el monto que realmente se entregó.
            </p>
          )}
          {!matches && Number.isFinite(totalCents) && totalCents > 0 ? (
            <p className="text-sm text-amber-700">
              Faltan {currency(Math.abs(expectedCents - totalCents) / 100)} {totalCents > expectedCents ? 'de más' : 'por contar'}.
            </p>
          ) : null}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={close} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Volver</button>
            <Button type="submit" isLoading={busy} disabled={!matches} className="bg-emerald-600 hover:bg-emerald-700">Confirmar entrada a caja</Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
