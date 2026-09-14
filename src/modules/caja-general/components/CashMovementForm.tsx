import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileUploadField } from '@/modules/operations/components/returns/FileUploadField';
import { uploadOperationProof } from '@/modules/operations/api/operations-storage.api';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { cajaGeneralApi } from '../api/caja-general.api';
import { CASH_BANKS, CONCEPTS, type CashConcept, type CashDay, type CashDelivery, type CreateCashMovement } from '../types/caja-general.types';
import { currency, emptyCounts, parseCents, validateCashAmount } from '../utils/cash-amounts';
import { DenominationFields } from './DenominationFields';
import { cashButton, cashInput } from './CashDayForm';
export function CashMovementForm({ day, busy, onSubmit }: { day: CashDay; busy: boolean; onSubmit: (request: CreateCashMovement) => Promise<unknown> }) {
  const { user } = useAuth();
  const [direction, setDirection] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [linked, setLinked] = useState(false);
  const [delivery, setDelivery] = useState<CashDelivery | null>(null);
  const [page, setPage] = useState(0);
  const [type, setType] = useState<CashConcept>('EFECTIVO');
  const [concept, setConcept] = useState('');
  const [bank, setBank] = useState('');
  const [amount, setAmount] = useState('');
  const [counts, setCounts] = useState(emptyCounts);
  const [files, setFiles] = useState<FileList>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const retry = useRef<{ signature: string; id: string } | null>(null);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  const deliveries = useQuery({ queryKey: ['caja-general', user?.userId, 'deliveries', page], queryFn: () => cajaGeneralApi.deliveries(page), enabled: linked });
  const pending = busy || uploading;
  async function submit(event: FormEvent) {
    event.preventDefault();
    const selectedAmount = linked && delivery ? String(delivery.monto) : amount;
    const problem = validateCashAmount(selectedAmount, counts, true);
    if (problem) { setError(problem); return; }
    if (linked && !delivery) { setError('Selecciona una entrega completada.'); return; }
    if (direction === 'SALIDA' && parseCents(selectedAmount) > Math.round(day.saldoActual * 100)) { setError('Saldo insuficiente: la caja no puede quedar negativa.'); return; }
    if (!concept.trim()) { setError('Captura el concepto.'); return; }
    setError(''); setUploading(true);
    try {
      let proof: string | null = null;
      const file = files?.[0];
      if (file) {
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
          setError('Usa un PDF o imagen de máximo 10 MB.'); return;
        }
        if (!user) { setError('La sesión no está disponible.'); return; }
        if (uploaded.current?.file !== file) {
          const result = await uploadOperationProof({ file, userId: user.userId });
          uploaded.current = { file, url: result.downloadUrl };
        }
        proof = uploaded.current!.url;
      }
      const data = { direccion: direction, tipo: linked ? 'EFECTIVO' as const : type, concepto: concept.trim(),
        banco: linked || type === 'EFECTIVO' ? null : bank, monto: linked ? null : parseCents(selectedAmount) / 100,
        parcialidadId: linked ? delivery!.id : null, denominaciones: counts, comprobanteUrl: proof };
      const signature = JSON.stringify(data);
      if (retry.current?.signature !== signature) retry.current = { signature, id: crypto.randomUUID() };
      await onSubmit({ ...data, requestId: retry.current.id });
      setConcept(''); setAmount(''); setCounts(emptyCounts()); setFiles(undefined); setDelivery(null);
      retry.current = null; uploaded.current = null;
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setUploading(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={pending} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Movimiento
          <select value={direction} onChange={e => { setDirection(e.target.value as typeof direction); setLinked(false); setDelivery(null); }} className={cashInput}>
            <option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option>
          </select>
        </label>
        {direction === 'SALIDA' && <label className="text-sm font-medium text-slate-700">Origen de la salida
          <select value={linked ? 'linked' : 'manual'} onChange={e => { setLinked(e.target.value === 'linked'); setDelivery(null); }} className={cashInput}>
            <option value="manual">Manual (sin entrega previa)</option><option value="linked">Vincular entrega existente</option>
          </select>
        </label>}
      </div>
      {linked ? <div className="space-y-2 rounded-xl bg-slate-50 p-4">
        <label className="text-sm font-medium text-slate-700">Entrega de efectivo completada
          <select required aria-label="Entrega de efectivo completada" value={delivery?.id ?? ''} onChange={e => {
            const selected = deliveries.data?.find(item => item.id === Number(e.target.value)) ?? null;
            setDelivery(selected); if (selected) setConcept(`Entrega #${selected.id} · Operación #${selected.operacionId}`);
          }} className={cashInput}>
            <option value="">Selecciona una entrega</option>
            {(deliveries.data ?? []).map(item => <option key={item.id} value={item.id}>#{item.id} · Operación #{item.operacionId} · {currency(item.monto)} · {item.personaQueRecibioEfectivo ?? 'Sin receptor registrado'}</option>)}
          </select>
        </label>
        {deliveries.isPending && <p className="text-sm">Cargando entregas…</p>}
        {deliveries.isError && <p role="alert">{getApiErrorMessage(deliveries.error)} <button type="button" onClick={() => void deliveries.refetch()}>Reintentar</button></p>}
        <div className="flex items-center gap-3 text-sm">
          <button type="button" disabled={page === 0} onClick={() => { setPage(page - 1); setDelivery(null); }}>Anterior</button>
          <span>Página {page + 1}</span>
          <button type="button" disabled={deliveries.data?.length !== 50} onClick={() => { setPage(page + 1); setDelivery(null); }}>Siguiente</button>
        </div>
        <p className="text-sm text-slate-600">Importe de la entrega: <strong>{delivery ? currency(delivery.monto) : '—'}</strong>. Se toma del registro original.</p>
      </div> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Tipo de concepto
            <select value={type} onChange={e => setType(e.target.value as CashConcept)} className={cashInput}>
              {Object.entries(CONCEPTS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Importe
            <input type="text" inputMode="decimal" required value={amount} onChange={e => setAmount(e.target.value)} className={cashInput} />
          </label>
        </div>
        {type !== 'EFECTIVO' && <label className="block text-sm font-medium text-slate-700">Banco
          <select required value={bank} onChange={e => setBank(e.target.value)} className={cashInput}>
            <option value="">Selecciona un banco</option>{CASH_BANKS.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>}
        <p className="text-sm text-slate-600">Registra únicamente efectivo que entra o sale físicamente. Si ya existe una entrega, usa “Vincular entrega existente”.</p>
      </>}
      <label className="block text-sm font-medium text-slate-700">Concepto
        <input required maxLength={300} value={concept} onChange={e => setConcept(e.target.value)} className={cashInput} />
      </label>
      <DenominationFields value={counts} onChange={setCounts} />
      <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-medium">Comprobante opcional</summary>
        <div className="mt-3"><FileUploadField inputId="caja-general-proof" value={files} onChange={setFiles} /></div>
      </details>
      <button disabled={pending} className={cashButton}>{pending ? 'Guardando…' : 'Registrar movimiento'}</button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </form>;
}
