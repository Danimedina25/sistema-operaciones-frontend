import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { RowActionsMenu } from '@/shared/components/ui/RowActionsMenu';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatAccount, formatPercent } from '@/shared/format';
import type { CommercialPartnerResponse } from '../types/socioscomerciales.types';
import { Landmark } from 'lucide-react';

interface Props {
  commercialPartners: CommercialPartnerResponse[];
  processingPartnerId: number | null;
  canEdit: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
  canConfigureCommission?: boolean;
  editableOwnerId?: number;
  onConfigureCommission?: (partner: CommercialPartnerResponse) => void;
  onEdit: (partner: CommercialPartnerResponse) => void;
  onActivate: (partnerId: number) => void;
  onDeactivate: (partnerId: number) => void;
  onDelete: (partner: CommercialPartnerResponse) => void;
}

export function CommercialPartnersTable({ commercialPartners, processingPartnerId, canEdit, canChangeStatus, canDelete, canConfigureCommission, editableOwnerId, onConfigureCommission, onEdit, onActivate, onDeactivate, onDelete }: Props) {
  const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toLocaleUpperCase('es-MX');
  const name = (partner: CommercialPartnerResponse) => <div className="flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials(partner.nombre)}</span>
    <span className="min-w-0 truncate font-semibold text-slate-900" title={partner.nombre}>{partner.nombre}</span>
    {!partner.activo && <StatusBadge active={false} />}
  </div>;
  const actions = (partner: CommercialPartnerResponse) => {
    const ownsPartner = editableOwnerId === undefined || editableOwnerId === partner.socioComercialId;
    if (!(canEdit && ownsPartner || canChangeStatus && ownsPartner || canDelete || canConfigureCommission)) return null;
    return <RowActionsMenu triggerLabel="" ariaLabel={`Opciones de ${partner.nombre}`} triggerClassName="min-w-10 justify-center px-2" triggerDisabled={processingPartnerId === partner.id}>
    {canEdit && ownsPartner && <button type="button" onClick={() => onEdit(partner)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Editar</button>}
    {canConfigureCommission && <button type="button" onClick={() => onConfigureCommission?.(partner)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Configurar comisión</button>}
    {canChangeStatus && ownsPartner && (partner.activo
      ? <button type="button" onClick={() => onDeactivate(partner.id)} className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50">Desactivar</button>
      : <button type="button" onClick={() => onActivate(partner.id)} className="block w-full px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50">Activar</button>)}
    {canDelete && <button type="button" onClick={() => onDelete(partner)} className="block w-full border-t border-red-100 px-4 py-2.5 text-left text-sm text-red-900 hover:bg-red-50">Eliminar definitivamente</button>}
  </RowActionsMenu>;
  };
  const account = (partner: CommercialPartnerResponse) => <div className="flex items-start gap-2" title={`${partner.banco} · ${partner.titularCuenta}`}><Landmark aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0"><span className="block truncate text-slate-900">{formatAccount(partner.banco, partner.cuentaBancaria)}</span><small className="block truncate text-xs text-slate-400">Titular: {partner.titularCuenta}</small></span></div>;
  const columns: DataTableColumn<CommercialPartnerResponse>[] = [
    { key: 'name', header: 'Nombre', cell: name },
    { key: 'owner', header: 'Registrado por', cell: partner => <span className="block truncate" title={partner.socioComercialNombre}>{partner.socioComercialNombre}</span>, width: '170px' },
    { key: 'account', header: 'Cuenta para pago de comisión', cell: account, width: '270px' },
    { key: 'commission', header: 'Comisión', cell: (partner) => partner.commissionConfigured === false ? <StatusBadge tone="pending">Por configurar</StatusBadge> : formatPercent(partner.porcentajeComision), width: '130px' },
    ...(canEdit || canChangeStatus || canDelete || canConfigureCommission ? [{ key: 'actions', header: 'Opciones', cell: actions, kind: 'actions' as const, align: 'right' as const, width: '90px' }] : []),
  ];
  return <DataTable columns={columns} rows={commercialPartners} getRowKey={(partner) => partner.id}
    emptyTitle="No se encontraron socios comerciales" emptyDescription="Prueba otra búsqueda o cambia el filtro de estado."
    mobile={{ title: name, fields: [
      { key: 'owner', label: 'Registrado por', value: partner => partner.socioComercialNombre },
      { key: 'account', label: 'Cuenta', value: account },
      { key: 'commission', label: 'Comisión', value: (partner) => partner.commissionConfigured === false ? 'Por configurar' : formatPercent(partner.porcentajeComision) },
    ], actions: canEdit || canChangeStatus || canDelete || canConfigureCommission ? actions : undefined }} />;
}
