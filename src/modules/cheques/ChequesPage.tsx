import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { chequesApi } from './api';
import { chequeLabels, type ChequeFilters, type ChequeState } from './types';
import { ChequeManager } from './ChequeManager';
import { buildOperationDetailPath } from '@/routes/paths';
import { currency } from '@/modules/caja-general/utils/cash-amounts';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';
import { TableFilterSection } from '@/shared/components/ui/TableFilterSection';
import { QueryState } from '@/shared/components/ui/QueryState';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Button } from '@/shared/components/ui/Button';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';
import {
  fieldControl,
  fieldLabel,
  noteWarning,
  smallOutlineButton,
  tableCell,
  tableHeadCell,
  tableHeadRow,
  tableRow,
  tableShell,
} from '@/shared/styles/ui-tokens';
import { getApiErrorMessage } from '@/shared/utils/errors';

const defaults: ChequeFilters = { estados: 'POR_COBRAR,DEPOSITADO,PENDIENTE_COBRO_EFECTIVO', busqueda: '', cliente: '', operacionId: '', banco: '', desde: '', hasta: '', page: 0 };

const TEXT_FIELDS = ['busqueda', 'cliente', 'operacionId', 'banco', 'desde', 'hasta'] as const;

const FIELD_LABELS: Record<(typeof TEXT_FIELDS)[number], string> = {
  busqueda: 'Número o datos del cheque',
  cliente: 'Cliente',
  operacionId: 'Operación',
  banco: 'Banco emisor',
  desde: 'Recibido desde',
  hasta: 'Recibido hasta',
};

/** Mismo reparto de color que el resto del sistema: ámbar pendiente, azul en proceso. */
const STATE_TONE: Record<ChequeState, string> = {
  POR_COBRAR: 'border-amber-200 bg-amber-50 text-amber-700',
  DEPOSITADO: 'border-blue-200 bg-blue-50 text-blue-700',
  PENDIENTE_COBRO_EFECTIVO: 'border-amber-200 bg-amber-50 text-amber-700',
  COBRADO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DEVUELTO: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELADO: 'border-slate-200 bg-slate-100 text-slate-600',
};

function ChequeStateBadge({ estado, requiereConciliacion }: { estado: ChequeState | null; requiereConciliacion: boolean }) {
  if (requiereConciliacion || !estado) {
    return <span className={`${STATUS_BADGE_CLASS} border-slate-200 bg-slate-100 text-slate-600`}>Requiere conciliación</span>;
  }

  return <span className={`${STATUS_BADGE_CLASS} ${STATE_TONE[estado]}`}>{chequeLabels[estado]}</span>;
}

export default function ChequesPage() {
  // El borrador se aplica al enviar: se capturan varios criterios antes de consultar.
  const [draft, setDraft] = useState(defaults);
  const [filters, setFilters] = useState(defaults);
  const [selected, setSelected] = useState<number | null>(null);
  const invalidDates = !!filters.desde && !!filters.hasta && filters.desde > filters.hasta;
  const query = useQuery({ queryKey: ['cheques', 'list', filters], queryFn: () => chequesApi.list(filters), enabled: !invalidDates, retry: false });
  const cheques = query.data?.content ?? [];

  return <div className="space-y-3">
    <PageHeader
      title="Cheques por cobrar"
      description="Consulta y gestiona los cheques recibidos como pagos de ingreso."
    />

    <TableFilterSection title="Filtros">
      <form onSubmit={e => { e.preventDefault(); setFilters({ ...draft, page: 0 }); }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="cheque-estado" className={fieldLabel}>Estado</label>
            <select id="cheque-estado" className={fieldControl} value={draft.estados} onChange={e => setDraft({ ...draft, estados: e.target.value })}>
              <option value="POR_COBRAR,DEPOSITADO,PENDIENTE_COBRO_EFECTIVO">Pendientes y en proceso</option>
              <option value="">Todos</option>
              {Object.entries(chequeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          {TEXT_FIELDS.map(key => (
            <div key={key}>
              <label htmlFor={`cheque-${key}`} className={fieldLabel}>{FIELD_LABELS[key]}</label>
              <input
                id={`cheque-${key}`}
                className={fieldControl}
                type={key === 'desde' || key === 'hasta' ? 'date' : key === 'operacionId' ? 'number' : 'text'}
                min={key === 'operacionId' ? 1 : undefined}
                value={draft[key]}
                onChange={e => setDraft({ ...draft, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit">Filtrar</Button>
        </div>
      </form>
    </TableFilterSection>

    {invalidDates ? (
      <p role="alert" className={noteWarning}>La fecha inicial no puede ser posterior a la final.</p>
    ) : (
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Cargando cheques…"
        errorTitle={query.isError ? `No se pudieron cargar los cheques. ${getApiErrorMessage(query.error)}` : undefined}
      >
        {query.data ? <div className="space-y-3">
          {query.data.totales.map(total => (
            <div key={total.moneda} className="grid gap-3 sm:grid-cols-3">
              <MetricCard label={`Por cobrar · ${total.moneda}`} value={currency(total.porCobrar)} variant="amber" />
              <MetricCard label={`Depositados · ${total.moneda}`} value={currency(total.depositados)} variant="blue" />
              <MetricCard label={`Cobrados · ${total.moneda}`} value={currency(total.cobrados)} variant="emerald" />
            </div>
          ))}

          <p className="text-xs text-slate-500">Totales de todos los estados para los demás filtros seleccionados.</p>

          {cheques.length === 0 ? (
            <EmptyState title="Sin cheques" description="No se encontraron cheques con estos filtros." />
          ) : (
            <div className={tableShell}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr className={tableHeadRow}>
                      <th className={tableHeadCell}>Cheque / banco</th>
                      <th className={tableHeadCell}>Cliente / operación</th>
                      <th className={`${tableHeadCell} text-right`}>Importe</th>
                      <th className={tableHeadCell}>Estado</th>
                      <th className={tableHeadCell}>Destino</th>
                      <th className={`${tableHeadCell} text-right`}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cheques.map(cheque => (
                      <tr key={cheque.id} className={tableRow}>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {cheque.numeroCheque || 'Sin número'}
                          <span className="block text-xs font-normal text-slate-500">{cheque.bancoEmisor}</span>
                        </td>

                        <td className={tableCell}>
                          {cheque.clienteNombre}
                          <Link className="block text-xs text-slate-700 underline" to={buildOperationDetailPath(cheque.operacionId)}>
                            Operación #{cheque.operacionId}
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums text-slate-900">
                          {currency(cheque.monto)} {cheque.moneda}
                        </td>

                        <td className="px-4 py-4">
                          <ChequeStateBadge estado={cheque.estado} requiereConciliacion={cheque.requiereConciliacion} />
                        </td>

                        <td className={tableCell}>
                          {cheque.destinoCobro === 'EFECTIVO' ? 'Caja General' : cheque.cuentaDestinoEtiqueta ?? 'Por definir'}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button type="button" className={smallOutlineButton} onClick={() => setSelected(cheque.pagoId)}>
                            Ver / gestionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Pagination
            currentPage={filters.page + 1}
            totalPages={query.data.totalPages}
            totalElements={query.data.totalElements}
            isLoading={query.isFetching}
            onPageChange={next => setFilters({ ...filters, page: next - 1 })}
          />
        </div> : null}
      </QueryState>
    )}

    {selected !== null && <ChequeManager paymentId={selected} onClose={() => setSelected(null)} />}
  </div>;
}
