import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { formatCurrency } from '@/modules/operations/utils/operation-formatters';
import {
  computeBalanceAfterInstallment,
  isCashReturnMethod,
  resolveInstallmentSubmitLabel,
  resolveReturnRequestTotals,
} from '@/modules/operations/utils/return-installment';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';

interface SelectOption {
  id: number;
  label: string;
}

export interface RegisterInstallmentFormValues {
  monto: string;
  cuentaOrigenId?: string;
  comprobante?: FileList;
  fechaRecoleccion?: string;
  horaRecoleccion?: string;
  codigoRetiroSinTarjeta?: string;
  observaciones?: string;
}

interface RegisterInstallmentFormProps {
  returnRequest: ReturnPaymentResponse;
  bankAccounts: SelectOption[];
  isSubmitting: boolean;
  onSubmit: (values: RegisterInstallmentFormValues) => Promise<void>;
  /** Oculta el panel "Solicitud seleccionada" (lo muestra ReturnRequestSummarySection). */
  hideSummary?: boolean;
}

function parseMonto(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function RegisterInstallmentForm({
  returnRequest,
  bankAccounts,
  isSubmitting,
  onSubmit,
  hideSummary = false,
}: RegisterInstallmentFormProps) {
  const totals = resolveReturnRequestTotals(returnRequest);
  const esEfectivo = isCashReturnMethod(returnRequest.tipoPago);
  const esRetiroSinTarjeta = returnRequest.tipoPago === 'RETIRO_SIN_TARJETA';
  const requiereCuentaOrigen =
    returnRequest.tipoPago === 'TRANSFERENCIA' ||
    returnRequest.tipoPago === 'DEPOSITO' ||
    esRetiroSinTarjeta;
  const requiereComprobante = !esEfectivo;
  const requiereFechaHora = esEfectivo;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterInstallmentFormValues>({
    defaultValues: {
      monto: '',
      cuentaOrigenId: '',
      observaciones: '',
      fechaRecoleccion: '',
      horaRecoleccion: '',
      codigoRetiroSinTarjeta: '',
    },
    mode: 'onChange',
  });

  const montoRaw = useWatch({ control, name: 'monto' }) ?? '';
  const importe = parseMonto(montoRaw);
  const pendienteDespues = computeBalanceAfterInstallment(totals.montoDisponible, importe);

  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountOptions, setShowAccountOptions] = useState(false);

  const filteredAccounts = useMemo(() => {
    const search = accountSearch.trim().toLowerCase();
    if (!search) return bankAccounts;
    return bankAccounts.filter((a) => a.label.toLowerCase().includes(search));
  }, [bankAccounts, accountSearch]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {!hideSummary ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Solicitud seleccionada</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Folio</dt>
              <dd className="font-semibold text-slate-900">#{returnRequest.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Método</dt>
              <dd className="font-semibold text-slate-900">
                {paymentTypeLabels[returnRequest.tipoPago]}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Monto solicitado</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(totals.montoSolicitado)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ya retornado</dt>
              <dd className="font-semibold text-emerald-700">
                {formatCurrency(totals.montoRetornado)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Pendiente actual</dt>
              <dd className="font-semibold text-amber-700">
                {formatCurrency(totals.montoPendiente)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Disponible por registrar</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(totals.montoDisponible)}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Importe del retorno
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          {...register('monto', {
            validate: (value) => {
              const n = parseMonto(value ?? '');
              if (n <= 0) return 'El importe debe ser mayor a 0';
              if (n > totals.montoDisponible)
                return `El importe no puede superar ${formatCurrency(totals.montoDisponible)}`;
              return true;
            },
          })}
        />
        {errors.monto ? (
          <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Pendiente después del retorno: {formatCurrency(pendienteDespues)}
          </p>
        )}
      </div>

      {requiereCuentaOrigen ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Cuenta origen</label>
          <div className="relative">
            <input
              type="hidden"
              {...register('cuentaOrigenId', {
                validate: (value) =>
                  !requiereCuentaOrigen || Number(value) > 0 || 'La cuenta origen es obligatoria',
              })}
            />
            <input
              type="text"
              value={accountSearch}
              placeholder="Buscar cuenta..."
              onFocus={() => setShowAccountOptions(true)}
              onBlur={() => setTimeout(() => setShowAccountOptions(false), 150)}
              onChange={(event) => {
                setAccountSearch(event.target.value);
                setValue('cuentaOrigenId', '', { shouldValidate: false });
                setShowAccountOptions(true);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
            />
            {showAccountOptions && (
              <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setAccountSearch(account.label);
                        setValue('cuentaOrigenId', String(account.id), {
                          shouldValidate: true,
                        });
                        setShowAccountOptions(false);
                      }}
                    >
                      {account.label}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No se encontraron cuentas</div>
                )}
              </div>
            )}
          </div>
          {errors.cuentaOrigenId ? (
            <p className="mt-1 text-xs text-red-600">{errors.cuentaOrigenId.message}</p>
          ) : null}
        </div>
      ) : null}

      {requiereFechaHora ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha de recolección
            </label>
            <input
              type="date"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('fechaRecoleccion', {
                validate: (value) =>
                  !requiereFechaHora || !!value?.trim() || 'La fecha de recolección es obligatoria',
              })}
            />
            {errors.fechaRecoleccion ? (
              <p className="mt-1 text-xs text-red-600">{errors.fechaRecoleccion.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hora de recolección
            </label>
            <input
              type="time"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('horaRecoleccion', {
                validate: (value) =>
                  !requiereFechaHora || !!value?.trim() || 'La hora de recolección es obligatoria',
              })}
            />
            {errors.horaRecoleccion ? (
              <p className="mt-1 text-xs text-red-600">{errors.horaRecoleccion.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {esRetiroSinTarjeta ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Código de retiro sin tarjeta
          </label>
          <input
            type="text"
            placeholder="Código generado por el banco"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
            {...register('codigoRetiroSinTarjeta', {
              validate: (value) =>
                !esRetiroSinTarjeta ||
                !!value?.trim() ||
                'El código de retiro sin tarjeta es obligatorio',
            })}
          />
          {errors.codigoRetiroSinTarjeta ? (
            <p className="mt-1 text-xs text-red-600">{errors.codigoRetiroSinTarjeta.message}</p>
          ) : null}
        </div>
      ) : null}

      {requiereComprobante ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Comprobante de pago</label>
          <Controller
            control={control}
            name="comprobante"
            rules={{
              validate: (value) =>
                !requiereComprobante ||
                (value && value.length > 0) ||
                'El comprobante es obligatorio',
            }}
            render={({ field }) => (
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                onChange={(event) => field.onChange(event.target.files)}
              />
            )}
          />
          {errors.comprobante ? (
            <p className="mt-1 text-xs text-red-600">{errors.comprobante.message}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Observaciones</label>
        <textarea
          rows={3}
          placeholder="Opcional"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
          {...register('observaciones')}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full justify-center">
        {resolveInstallmentSubmitLabel({ totals, importe, esEfectivo })}
      </Button>
    </form>
  );
}
