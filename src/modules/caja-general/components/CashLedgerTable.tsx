import { Link } from 'react-router-dom';
import { buildOperationDetailPath } from '@/routes/paths';
import { DENOMINATIONS, type CashCounts, type CashLedger } from '../types/caja-general.types';
import { currency } from '../utils/cash-amounts';
export function CountSummary({ counts }: { counts: Partial<CashCounts> }) {
  return <table className="w-full text-right text-xs"><thead><tr><th>Denominación</th><th>Cantidad</th><th>Importe</th></tr></thead>
    <tbody>{DENOMINATIONS.map(([key, cents]) => <tr key={key}><td>{currency(cents / 100)}</td><td>{counts[key] ?? 0}</td><td>{currency((counts[key] ?? 0) * cents / 100)}</td></tr>)}</tbody>
  </table>;
}
export function CashLedgerTable({ ledger, canDelete = false, onDelete }: { ledger: CashLedger; canDelete?: boolean; onDelete?: (day: CashLedger['dias'][number]) => void }) {
  if (ledger.dias.length === 0) return <p className="p-6 text-sm text-slate-500">No hay aperturas registradas en este periodo.</p>;
  return <div className="space-y-6">{ledger.dias.map(day => {
    const movements = ledger.movimientos.filter(m => m.diaId === day.id);
    const incoming = movements.filter(m => m.direccion === 'ENTRADA').reduce((sum, m) => sum + Math.round(m.monto * 100), 0) / 100;
    const outgoing = movements.filter(m => m.direccion === 'SALIDA').reduce((sum, m) => sum + Math.round(m.monto * 100), 0) / 100;
    return <section key={day.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white"><div><h3 className="font-semibold">Corte del día {day.fecha}</h3><p className="text-sm text-slate-300">{day.closedAt ? 'Caja cerrada' : 'Caja abierta'}</p></div>
        {canDelete && <button type="button" onClick={() => onDelete?.(day)} className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25">Eliminar corte</button>}
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600"><tr>{['Movimiento', 'Entrada', 'Salida', 'Saldo acumulado'].map(label => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          <tr><td className="px-5 py-3"><details><summary className="cursor-pointer font-medium">Inicio en caja</summary><CountSummary counts={day.apertura} /></details></td><td /><td /><td className="px-5 py-3">{currency(day.saldoInicial)}</td></tr>
          {movements.map(m => <tr key={m.id}>
            <td className="min-w-72 px-5 py-3"><details><summary className="cursor-pointer font-medium text-slate-800">{m.concepto}</summary>
              <div className="mt-2 space-y-2 text-xs text-slate-600"><p>Registro #{m.id} · {m.createdAt.replace('T', ' ')} · Usuario #{m.creadoPor}{m.banco ? ` · ${m.banco}` : ''}</p>
                {m.parcialidadId && m.operacionId && <Link className="text-blue-700 underline" to={buildOperationDetailPath(m.operacionId)}>Operación #{m.operacionId} · Entrega #{m.parcialidadId}</Link>}
                {m.comprobanteUrl?.startsWith('https://') && <a className="block text-blue-700 underline" target="_blank" rel="noreferrer" href={m.comprobanteUrl}>Ver comprobante</a>}
                <CountSummary counts={m.denominaciones} />
              </div></details></td>
            <td className="whitespace-nowrap px-5 py-3 text-emerald-700">{m.direccion === 'ENTRADA' ? currency(m.monto) : '—'}</td>
            <td className="whitespace-nowrap px-5 py-3 text-red-700">{m.direccion === 'SALIDA' ? currency(m.monto) : '—'}</td>
            <td className="whitespace-nowrap px-5 py-3 font-medium">{currency(m.saldoAcumulado)}</td>
          </tr>)}
          <tr className="bg-slate-50 font-semibold"><td className="px-5 py-3">Corte total del día (esperado)</td><td className="px-5 py-3">{currency(incoming)}</td><td className="px-5 py-3">{currency(outgoing)}</td><td className="px-5 py-3">{currency(day.saldoActual)}</td></tr>
        </tbody>
      </table></div>
      {day.closedAt && <div className="space-y-2 border-t border-slate-200 p-5 text-sm">
        <p>Saldo contado: <strong>{currency(day.saldoContado ?? 0)}</strong> · Diferencia: <strong>{currency(day.diferencia ?? 0)}</strong></p>
        {day.observacionesCierre && <p>{day.observacionesCierre}</p>}
        <details><summary className="cursor-pointer font-medium">Desglose del cierre</summary><div className="mt-3 max-w-lg"><CountSummary counts={day.cierre} /></div></details>
      </div>}
    </section>;
  })}</div>;
}
