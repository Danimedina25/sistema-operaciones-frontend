import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { BankAccountCombobox } from '@/shared/components/ui/BankAccountCombobox';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { BankTransfer, CreateBankTransfer } from '../types/bank-transfers.types';
import { validateTransferAmount } from '../utils/transfer-amount';

/**
 * Transferencia entre cuentas propias. La cuenta beneficiaria excluye a la origen, y el
 * UUID de la solicitud se conserva al reintentar la misma captura para que un doble clic
 * o un error de red no la registren dos veces.
 */
export function BankTransferModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateBankTransfer) => Promise<BankTransfer>;
}) {
  const { accounts, isLoading } = useBankAccounts();
  const [origenId, setOrigenId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const retry = useRef<{ signature: string; id: string } | null>(null);

  const destinos = useMemo(() => accounts.filter(account => account.id !== origenId), [accounts, origenId]);

  function reset() {
    setOrigenId(null); setDestinoId(null); setMonto(''); setReferencia(''); setError('');
    retry.current = null;
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  function changeOrigen(next: number | null) {
    setOrigenId(next);
    if (next !== null && next === destinoId) setDestinoId(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!origenId) { setError('Selecciona la cuenta de la que sale el dinero.'); return; }
    if (!destinoId) { setError('Selecciona la cuenta beneficiaria.'); return; }
    const amountError = validateTransferAmount(monto);
    if (amountError) { setError(amountError); return; }

    const data = {
      cuentaOrigenId: origenId,
      cuentaDestinoId: destinoId,
      monto: Number(monto),
      referencia: referencia.trim() || null,
      comprobanteUrl: null,
    };
    const signature = JSON.stringify(data);
    if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
    setError('');
    setBusy(true);
    try {
      await onSubmit({ ...data, requestId: retry.current.id });
      reset();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Registrar transferencia entre cuentas" onClose={close}>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <p className="text-sm text-slate-600">
            El monto sale de la cuenta origen y entra a la beneficiaria en el mismo momento. Queda en el
            libro de movimientos de las dos cuentas.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <BankAccountCombobox
              label="Cuenta origen"
              accounts={accounts}
              value={origenId}
              onChange={changeOrigen}
              isLoading={isLoading}
              onlyActive
            />
            <BankAccountCombobox
              label="Cuenta beneficiaria"
              accounts={destinos}
              value={destinoId}
              onChange={setDestinoId}
              isLoading={isLoading}
              disabled={!origenId}
              placeholder={origenId ? undefined : 'Selecciona primero la cuenta origen'}
              onlyActive
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Monto
              <Input
                aria-label="Monto"
                inputMode="decimal"
                placeholder="0.00"
                value={monto}
                onChange={event => setMonto(event.target.value)}
                className="mt-1"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">Referencia (opcional)
              <Input
                aria-label="Referencia"
                maxLength={300}
                placeholder="Folio SPEI, clave de rastreo…"
                value={referencia}
                onChange={event => setReferencia(event.target.value)}
                className="mt-1"
              />
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={close} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <Button type="submit" isLoading={busy}>Registrar transferencia</Button>
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
