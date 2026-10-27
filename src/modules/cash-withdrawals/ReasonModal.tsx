import { useId, useRef, useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/utils/errors';

/** Rechazar o cancelar un retiro siempre deja constancia del motivo. */
export function ReasonModal({ open, title, description, confirmLabel, onClose, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<unknown>;
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const formId = useId();
  const errorId = useId();

  function close() {
    if (submitting.current) return;
    setMotivo(''); setError('');
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!motivo.trim()) { setError('Indica el motivo.'); return; }
    submitting.current = true;
    setBusy(true); setError('');
    try {
      await onConfirm(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      submitting.current = false; setBusy(false);
    }
  }

  return <Modal open={open} title={title} onClose={close} size="compact" busy={busy}
    footer={<>
      <Button type="button" variant="neutral" disabled={busy} onClick={close}>Cancelar</Button>
      <Button variant="destructive" type="submit" form={formId} isLoading={busy}>{confirmLabel}</Button>
    </>}>
    <form id={formId} onSubmit={submit} className="space-y-4">
      <section aria-label="Resumen de la acción" className="sticky top-0 z-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">{description}</p>
        {error && <p id={errorId} role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>
      <label className="block text-sm font-medium text-slate-700">Motivo
        <textarea aria-label="Motivo" value={motivo} maxLength={500} rows={3} disabled={busy}
          aria-invalid={!!error || undefined} aria-describedby={error ? errorId : undefined}
          onChange={event => { setMotivo(event.target.value); setError(''); }}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
      </label>
    </form>
  </Modal>;
}
