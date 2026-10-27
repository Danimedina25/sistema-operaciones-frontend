import { formatDate } from '@/modules/operations/utils/operation-formatters';
import { formatMoney, formatPercent, formatPeriod } from '@/shared/format';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { DataTable } from '@/shared/components/ui/DataTable';
import type { BeneficiaryCommissionDetailResponse } from '../types/commercial-partner-commissions.types';

interface Props {
  open: boolean;
  onClose: () => void;
  detail: BeneficiaryCommissionDetailResponse | null;
  isLoading: boolean;
  startDate: string;
  endDate: string;
}

export function BeneficiaryCommissionDetailModal({ open, onClose, detail, isLoading, startDate, endDate }: Props) {
  return <Modal open={open} onClose={onClose} size="wide" title="Detalle de comisiones"
    subtitle={`${detail?.beneficiaryName ? `${detail.beneficiaryName} · ` : ''}${formatPeriod(startDate, endDate)}`}
    footer={<div className="flex justify-end"><Button variant="neutral" onClick={onClose}>Cerrar</Button></div>}>
    {isLoading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Cargando detalle…</p>
      : !detail ? <p className="py-12 text-center text-sm text-slate-500">No se encontró información.</p>
      : <div className="space-y-5">
        <section aria-label="Resumen de comisiones" className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Operaciones del periodo</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{detail.totalOperations}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Total de comisiones</p>
            <p className="mt-1 break-words text-2xl font-bold text-emerald-900">{formatMoney(detail.totalCommission)}</p>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <h3 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-950">Desglose por operación</h3>
          <DataTable rows={detail.operations} getRowKey={row => row.commissionId} emptyTitle="Sin operaciones en este periodo"
            columns={[
              { key: 'folio', header: 'Folio', width: '8%', cell: row => `#${row.operationId}` },
              { key: 'cliente', header: 'Cliente', width: '24%', cell: row => row.clienteNombre },
              { key: 'fecha', header: 'Creada', width: '16%', cell: row => formatDate(row.operationDate) },
              { key: 'nivel', header: 'Nivel', width: '8%', cell: row => `N${row.nivel}` },
              { key: 'monto', header: 'Monto', width: '17%', align: 'right', cell: row => formatMoney(row.operationAmount) },
              { key: 'porcentaje', header: '%', width: '10%', align: 'right', cell: row => formatPercent(row.commissionPercentage) },
              { key: 'comision', header: 'Comisión', width: '17%', align: 'right', cell: row => <strong>{formatMoney(row.commissionAmount)}</strong> },
            ]}
            mobile={{
              title: row => `#${row.operationId} · ${row.clienteNombre}`,
              subtitle: row => `${formatDate(row.operationDate)} · Nivel ${row.nivel}`,
              fields: [
                { key: 'monto', label: 'Monto de operación', value: row => formatMoney(row.operationAmount) },
                { key: 'porcentaje', label: 'Porcentaje', value: row => formatPercent(row.commissionPercentage) },
                { key: 'comision', label: 'Comisión', value: row => <strong>{formatMoney(row.commissionAmount)}</strong> },
              ],
            }} />
        </section>
      </div>}
  </Modal>;
}
