import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { secondaryButton } from '@/shared/styles/ui-tokens';
import type { CashDay } from '../types/caja-general.types';
import { currency } from '../utils/cash-amounts';
import { formatCashDate } from '../utils/cash-dates';

export function DeleteCashDayModal({ day, movementCount, isSubmitting, onClose, onConfirm }: {
  day: CashDay | null;
  movementCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');

  const canDelete = confirmation === 'ELIMINAR' && reason.trim().length > 0 && !isSubmitting;

  return <Modal open={Boolean(day)} title="Eliminar corte de Caja General" onClose={onClose}>
    {day ? <div className="space-y-5">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Esta acción eliminará definitivamente el corte y sus movimientos.</p>
        <p className="mt-1">Las operaciones y los retornos originales vinculados se conservarán.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <div><dt className="text-slate-500">Fecha</dt><dd className="font-semibold">{formatCashDate(day.fecha)}</dd></div>
        <div><dt className="text-slate-500">Movimientos</dt><dd className="font-semibold">{movementCount}</dd></div>
        <div><dt className="text-slate-500">Saldo inicial</dt><dd className="font-semibold">{currency(day.saldoInicial)}</dd></div>
        <div><dt className="text-slate-500">Saldo esperado</dt><dd className="font-semibold">{currency(day.saldoActual)}</dd></div>
        <div><dt className="text-slate-500">Saldo contado</dt><dd className="font-semibold">{day.saldoContado == null ? 'Sin cierre' : currency(day.saldoContado)}</dd></div>
      </dl>
      <label className="block text-sm font-medium text-slate-700">Motivo de eliminación
        <textarea aria-label="Motivo de eliminación" required maxLength={500} disabled={isSubmitting} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Escribe <strong className="text-red-700">ELIMINAR</strong> para confirmar
        <input aria-label="Confirmación de eliminación" autoComplete="off" disabled={isSubmitting} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={isSubmitting} className={secondaryButton}>Cancelar</button>
        <Button type="button" disabled={!canDelete} onClick={() => void onConfirm(reason.trim())} className="bg-red-700 hover:bg-red-800">{isSubmitting ? 'Eliminando…' : 'Eliminar corte definitivamente'}</Button>
      </div>
    </div> : null}
  </Modal>;
}
