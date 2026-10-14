import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { CanAccess } from '@/shared/components/CanAccess';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatAccount, formatPercent } from '@/shared/format';
import type { CommercialPartnerResponse } from '../types/socioscomerciales.types';
import { Landmark } from 'lucide-react';

interface Props {
  commercialPartners: CommercialPartnerResponse[];
  processingPartnerId: number | null;
  onEdit: (partner: CommercialPartnerResponse) => void;
  onActivate: (partnerId: number) => void;
  onDeactivate: (partnerId: number) => void;
  onDelete: (partner: CommercialPartnerResponse) => void;
}

export function CommercialPartnersTable({ commercialPartners, processingPartnerId, onEdit, onActivate, onDeactivate, onDelete }: Props) {
  const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toLocaleUpperCase('es-MX');
  const name = (partner: CommercialPartnerResponse) => <div className="flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials(partner.nombre)}</span>
    <span className="min-w-0 truncate font-semibold text-slate-900" title={partner.nombre}>{partner.nombre}</span>
    {!partner.activo && <StatusBadge active={false} />}
  </div>;
  const actions = (partner: CommercialPartnerResponse) => <RowActionsMenu triggerLabel="" ariaLabel={`Opciones de ${partner.nombre}`} triggerClassName="min-w-10 justify-center px-2" triggerDisabled={processingPartnerId === partner.id}>
    <button type="button" onClick={() => onEdit(partner)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Editar</button>
    {partner.activo
      ? <button type="button" onClick={() => onDeactivate(partner.id)} className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50">Desactivar</button>
      : <button type="button" onClick={() => onActivate(partner.id)} className="block w-full px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50">Activar</button>}
    <CanAccess roles={['ADMIN', 'DIRECCION']}><button type="button" onClick={() => onDelete(partner)} className="block w-full border-t border-red-100 px-4 py-2.5 text-left text-sm text-red-900 hover:bg-red-50">Eliminar definitivamente</button></CanAccess>
  </RowActionsMenu>;
  const account = (partner: CommercialPartnerResponse) => <div className="flex items-start gap-2" title={`${partner.banco} · ${partner.titularCuenta}`}><Landmark aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0"><span className="block truncate text-slate-900">{formatAccount(partner.banco, partner.cuentaBancaria)}</span><small className="block truncate text-xs text-slate-400">Titular: {partner.titularCuenta}</small></span></div>;
  const columns: DataTableColumn<CommercialPartnerResponse>[] = [
    { key: 'name', header: 'Nombre', cell: name },
    { key: 'account', header: 'Cuenta para pago de comisión', cell: account, width: '270px' },
    { key: 'commission', header: 'Comisión', cell: (partner) => formatPercent(partner.porcentajeComision), width: '110px' },
    { key: 'actions', header: 'Opciones', cell: actions, kind: 'actions', align: 'right', width: '90px' },
  ];
  return <DataTable columns={columns} rows={commercialPartners} getRowKey={(partner) => partner.id}
    emptyTitle="No se encontraron socios comerciales" emptyDescription="Prueba otra búsqueda o cambia el filtro de estado."
    mobile={{ title: name, fields: [
      { key: 'account', label: 'Cuenta', value: account },
      { key: 'commission', label: 'Comisión', value: (partner) => formatPercent(partner.porcentajeComision) },
    ], actions }} />;
}
