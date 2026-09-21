import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { chequesApi } from './api';
import { chequeLabels, type ChequeFilters } from './types';
import { ChequeManager } from './ChequeManager';
import { buildOperationDetailPath } from '@/routes/paths';
import { currency } from '@/modules/caja-general/utils/cash-amounts';
import { getApiErrorMessage } from '@/shared/utils/errors';
const defaults: ChequeFilters = { estados: 'POR_COBRAR,DEPOSITADO,PENDIENTE_COBRO_EFECTIVO', busqueda: '', cliente: '', operacionId: '', banco: '', desde: '', hasta: '', page: 0 };
export default function ChequesPage() {
  const [draft, setDraft] = useState(defaults);
  const [filters, setFilters] = useState(defaults);
  const [selected, setSelected] = useState<number | null>(null);
  const invalidDates = !!filters.desde && !!filters.hasta && filters.desde > filters.hasta;
  const query = useQuery({ queryKey: ['cheques', 'list', filters], queryFn: () => chequesApi.list(filters), enabled: !invalidDates, retry: false });
  return <div className="space-y-6 p-4 sm:p-6">
    <div><h1 className="text-2xl font-bold">Cheques por cobrar</h1><p className="text-slate-600">Consulta y gestiona los cheques recibidos como pagos de ingreso.</p></div>
    <form className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3" onSubmit={e => { e.preventDefault(); setFilters({ ...draft, page: 0 }); }}>
      <label>Estado<select className="block w-full rounded border p-2" value={draft.estados} onChange={e => setDraft({ ...draft, estados: e.target.value })}><option value="POR_COBRAR,DEPOSITADO,PENDIENTE_COBRO_EFECTIVO">Pendientes y en proceso</option><option value="">Todos</option>{Object.entries(chequeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {(['busqueda', 'cliente', 'operacionId', 'banco', 'desde', 'hasta'] as const).map(key => <label key={key}>{({ busqueda: 'Número o datos del cheque', cliente: 'Cliente', operacionId: 'Operación', banco: 'Banco emisor', desde: 'Recibido desde', hasta: 'Recibido hasta' })[key]}<input className="block w-full rounded border p-2" type={key === 'desde' || key === 'hasta' ? 'date' : key === 'operacionId' ? 'number' : 'text'} min={key === 'operacionId' ? 1 : undefined} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
      <button className="self-end rounded bg-blue-700 p-2 text-white" type="submit">Filtrar</button>
    </form>
    {invalidDates && <p role="alert">La fecha inicial no puede ser posterior a la final.</p>}
    {query.isLoading && <p>Cargando cheques…</p>}
    {query.isError && <div role="alert"><p>No se pudieron cargar los cheques. {getApiErrorMessage(query.error)}</p><button onClick={() => void query.refetch()}>Reintentar</button></div>}
    {query.data && !invalidDates && <>
      {query.data.totales.map(t => <div key={t.moneda} className="grid gap-3 sm:grid-cols-3">{[['Por cobrar', t.porCobrar], ['Depositados', t.depositados], ['Cobrados', t.cobrados]].map(([label, amount]) => <div key={label} className="rounded-xl border bg-white p-4"><p>{label} · {t.moneda}</p><strong>{currency(Number(amount))}</strong></div>)}</div>)}
      <p className="text-sm text-slate-600">Totales de todos los estados para los demás filtros seleccionados.</p>
      <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Cheque / banco', 'Cliente / operación', 'Importe', 'Estado', 'Destino', ''].map((h, i) => <th className="p-3" key={i}>{h}</th>)}</tr></thead><tbody>{query.data.content.map(c => <tr key={c.id} className="border-t"><td className="p-3">{c.numeroCheque || 'Sin número'}<br />{c.bancoEmisor}</td><td className="p-3">{c.clienteNombre}<br /><Link className="text-blue-700" to={buildOperationDetailPath(c.operacionId)}>#{c.operacionId}</Link></td><td className="p-3">{currency(c.monto)} {c.moneda}</td><td className="p-3">{c.requiereConciliacion || !c.estado ? 'Requiere conciliación' : chequeLabels[c.estado]}</td><td className="p-3">{c.destinoCobro === 'EFECTIVO' ? 'Caja General' : c.cuentaDestinoEtiqueta ?? 'Por definir'}</td><td className="p-3"><button className="rounded border px-3 py-2" onClick={() => setSelected(c.pagoId)}>Ver / gestionar</button></td></tr>)}</tbody></table>{query.data.content.length === 0 && <p className="p-4">No se encontraron cheques.</p>}</div>
      <div className="flex gap-4"><button disabled={filters.page === 0} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</button><span>{query.data.totalElements} cheques · Página {filters.page + 1} de {Math.max(1, query.data.totalPages)}</span><button disabled={filters.page + 1 >= query.data.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Siguiente</button></div>
    </>}
    {selected !== null && <ChequeManager paymentId={selected} onClose={() => setSelected(null)} />}
  </div>;
}
