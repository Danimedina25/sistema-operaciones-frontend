import { useMemo } from 'react';
import {
  OPERATIONS_QUICK_PAYMENT_TYPE_FILTERS,
  OPERATIONS_QUICK_STATUS_FILTERS,
  operationStatusLabels,
  paymentStatusLabels,
} from '@/modules/operations/constants/operations.constants';
import { Input } from '@/shared/components/ui/Input';
import { DateRangeCalendarField } from '@/shared/components/ui/DateRangeCalendarField';
import { QuickFilters } from '@/shared/components/dashboard/QuickFilters';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import {
  OperationDateFilter,
  OperationStatus,
  PaymentStatus,
  OperationsFilters as OperationsFiltersType,
} from '../types/operations.types.ts';

interface SocioOption {
  id: number;
  nombre: string;
}

interface OperationsFiltersProps {
  filters: OperationsFiltersType;
  onChange: (next: OperationsFiltersType) => void;
  showEstatusFilter?: boolean;
  showPaymentTypeFilter?: boolean;
  bankAccounts?: BankAccountResponse[];
  showSocioFilter?: boolean;
  socios?: SocioOption[];
}

const operationStatuses = Object.keys(operationStatusLabels) as OperationStatus[];

const paymentStatusFilterOptions = Object.keys(
  paymentStatusLabels,
) as PaymentStatus[];

const quickFilters: Array<{ value: OperationDateFilter; label: string }> = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes pasado' },
];

export function OperationsFilters({
  filters,
  onChange,
  showEstatusFilter = true,
  showPaymentTypeFilter = false,
  bankAccounts = [],
  showSocioFilter = false,
  socios = [],
}: OperationsFiltersProps) {
  const activeBankAccounts = useMemo(
    () => bankAccounts.filter((account) => account.activo),
    [bankAccounts],
  );

  const bankNames = useMemo(
    () => Array.from(new Set(activeBankAccounts.map((account) => account.banco))).sort(),
    [activeBankAccounts],
  );

  const accountsForSelectedBank = useMemo(
    () =>
      filters.banco
        ? activeBankAccounts.filter((account) => account.banco === filters.banco)
        : activeBankAccounts,
    [activeBankAccounts, filters.banco],
  );

  function handleQuickFilterChange(value: OperationDateFilter) {
    onChange({
      ...filters,
      dateFilter: filters.dateFilter === value ? '' : value,
      startDate: '',
      endDate: '',
    });
  }

  function handleClearFilters() {
    onChange({
      operationId: 0,
      search: '',
      status: 'ALL',
      dateFilter: '',
      startDate: '',
      endDate: '',
      activo: 'ACTIVE',
      paymentTypes: '',
      paymentStatus: '',
      returnStatuses: '',
      cuentaDestinoId: 0,
      banco: '',
      socioComercialId: 0,
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Filtros rápidos
        </label>
        <QuickFilters
          options={OPERATIONS_QUICK_STATUS_FILTERS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
        />
      </div>

      {showPaymentTypeFilter && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Filtros rápidos por tipo de ingreso
            </label>
            <QuickFilters
              options={OPERATIONS_QUICK_PAYMENT_TYPE_FILTERS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={filters.paymentTypes}
              onChange={(paymentTypes) => onChange({ ...filters, paymentTypes })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Estatus del comprobante
            </label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 sm:w-44"
              value={filters.paymentStatus}
              onChange={(e) =>
                onChange({
                  ...filters,
                  paymentStatus: e.target.value as PaymentStatus | '',
                })
              }
            >
              <option value="">Todos</option>
              {paymentStatusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showPaymentTypeFilter && bankAccounts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Banco</label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              value={filters.banco}
              onChange={(e) =>
                onChange({ ...filters, banco: e.target.value, cuentaDestinoId: 0 })
              }
            >
              <option value="">Todos los bancos</option>
              {bankNames.map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Cuenta destino
            </label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              value={filters.cuentaDestinoId || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  cuentaDestinoId: e.target.value ? Number(e.target.value) : 0,
                })
              }
            >
              <option value="">Todas las cuentas</option>
              {accountsForSelectedBank.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.banco} · {account.titular} · {maskAccountNumber(account.numeroCuenta)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showSocioFilter && socios.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Socio comercial
          </label>
          <select
            className="h-9 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
            value={filters.socioComercialId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                socioComercialId: e.target.value ? Number(e.target.value) : 0,
              })
            }
          >
            <option value="">Todos los socios activos</option>
            {socios.map((socio) => (
              <option key={socio.id} value={socio.id}>
                {socio.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Buscar
          </label>
          <Input
            placeholder="Folio, Cliente o Socio comercial"
            value={filters.search}
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
            onChange={(e) =>
              onChange({
                ...filters,
                search: e.target.value,
              })
            }
          />
        </div>

        {showEstatusFilter && (
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Estatus de la operación
            </label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              value={filters.status}
              onChange={(e) =>
                onChange({
                  ...filters,
                  status: e.target.value as OperationStatus | 'ALL',
                })
              }
            >
              <option value="ALL">Todos</option>
              {operationStatuses.map((status) => (
                <option key={status} value={status}>
                  {operationStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Rango de fechas
          </label>
          <DateRangeCalendarField
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={({ startDate, endDate }) =>
              onChange({
                ...filters,
                startDate,
                endDate,
                dateFilter: '',
              })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Estado
          </label>
          <select
            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
            value={filters.activo}
            onChange={(e) =>
              onChange({
                ...filters,
                activo: e.target.value as OperationsFiltersType['activo'],
              })
            }
          >
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Filtros rápidos de fecha
          </label>

          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => {
              const isActive = filters.dateFilter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleQuickFilterChange(item.value)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}