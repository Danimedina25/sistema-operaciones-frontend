import { getApiErrorMessage } from '@/shared/utils/errors';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { formatCurrency } from '@/modules/operations/utils/operation-formatters';
import {
  computeBalanceAfterInstallment,
  isCashReturnMethod,
  resolveInstallmentSubmitLabel,
  resolveReturnRequestTotals,
} from '@/modules/operations/utils/return-installment';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { FileUploadField } from './FileUploadField';
import { CollectionTimeField } from './CollectionTimeField';
import { formatDateTime } from '@/shared/format';

interface SelectOption {
  id: number;
  label: string;
}

export interface RegisterInstallmentFormValues {
  monto: string;
  cuentaOrigenId?: string;
  comprobante?: FileList;
  evidenciaImportePreparado?: FileList;
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
  onAmountChange?: (amount: number) => void;
  onValidationErrors?: (messages: string[]) => void;
  /** Oculta el panel "Solicitud seleccionada" (lo muestra ReturnRequestSummarySection). */
  hideSummary?: boolean;
  compactBankPanel?: boolean;
  onCancel?: () => void;
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
  onAmountChange,
  onValidationErrors,
  hideSummary = false,
  compactBankPanel = false,
  onCancel,
}: RegisterInstallmentFormProps) {
  const formId = useId();
  const submitting = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const totals = resolveReturnRequestTotals(returnRequest);
  const esEfectivo = isCashReturnMethod(returnRequest.tipoPago);
  const esRetiroSinTarjeta = returnRequest.tipoPago === 'RETIRO_SIN_TARJETA';
  const requiereCuentaOrigen =
    returnRequest.tipoPago === 'TRANSFERENCIA' ||
    returnRequest.tipoPago === 'DEPOSITO';
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

  const errorMessages = JSON.stringify([...Object.values(errors).map(error => error?.message).filter((message): message is string => typeof message === 'string'), ...(submitError ? [submitError] : [])]);
  useEffect(() => {
    onValidationErrors?.(JSON.parse(errorMessages) as string[]);
  }, [errorMessages, onValidationErrors]);
  useEffect(() => () => onValidationErrors?.([]), [onValidationErrors]);

  const montoRaw = useWatch({ control, name: 'monto' }) ?? '';
  const collectionDate = useWatch({ control, name: 'fechaRecoleccion' });
  const collectionTime = useWatch({ control, name: 'horaRecoleccion' });
  const importe = parseMonto(montoRaw);
  const pendienteDespues = computeBalanceAfterInstallment(totals.montoDisponible, importe);

  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [showObservations, setShowObservations] = useState(false);

  const filteredAccounts = useMemo(() => {
    const search = accountSearch.trim().toLowerCase();
    if (!search) return bankAccounts;
    return bankAccounts.filter((a) => a.label.toLowerCase().includes(search));
  }, [bankAccounts, accountSearch]);

  async function submitInstallment(values: RegisterInstallmentFormValues) {
    if (isSubmitting || submitting.current) return;
    submitting.current = true; setSubmitError('');
    try { await onSubmit(values); } catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { submitting.current = false; }
  }

  return (
    <form id={formId} className={compactBankPanel ? 'space-y-5' : 'space-y-6'} onChange={() => { if (submitError) setSubmitError(''); }} onSubmit={handleSubmit(submitInstallment)}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
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
      {esRetiroSinTarjeta && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Cuenta asignada por Cuentas: <strong>{returnRequest.cuentaOrigenNombre} ••{returnRequest.cuentaOrigenNumero} · {returnRequest.cuentaOrigenTitular}</strong>. Al preparar esta parcialidad se descuenta del banco y queda en custodia para el cliente, sin ingresar a Caja General.</p>}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Importe del retorno
        </label>
        <div className="relative">
        {compactBankPanel && <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>}
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          className={compactBankPanel ? 'h-11 w-full rounded-xl border border-blue-500 bg-white pl-7 pr-28 text-sm outline-none focus:border-blue-600' : 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900'}
          {...register('monto', {
            onChange: (event) => onAmountChange?.(parseMonto(event.target.value)),
            validate: (value) => {
              const n = parseMonto(value ?? '');
              if (n <= 0) return 'El importe debe ser mayor a 0';
              if (n > totals.montoDisponible)
                return `El importe no puede superar ${formatCurrency(totals.montoDisponible)}`;
              return true;
            },
          })}
        />
        {compactBankPanel && <button type="button" onClick={() => { setValue('monto', String(totals.montoDisponible), { shouldValidate: true }); onAmountChange?.(totals.montoDisponible); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">Pagar todo</button>}
        </div>
        {!onValidationErrors && errors.monto && !(esEfectivo && onAmountChange && importe > totals.montoDisponible) ? (
          <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p>
        ) : !esEfectivo ? (
          <p className={compactBankPanel ? 'mt-1 text-xs text-emerald-700' : 'mt-1 text-xs text-slate-500'}>
            Pendiente después del retorno: {formatCurrency(pendienteDespues)}
          </p>
        ) : null}
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
          {!onValidationErrors && errors.cuentaOrigenId ? (
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
            {!onValidationErrors && errors.fechaRecoleccion ? (
              <p className="mt-1 text-xs text-red-600">{errors.fechaRecoleccion.message}</p>
            ) : null}
          </div>
          <div>
            <Controller name="horaRecoleccion" control={control}
              rules={{ validate: value => !!value?.trim() || 'Indica una hora de 1 a 12 y minutos de 00 a 59' }}
              render={({ field }) => <CollectionTimeField value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={isSubmitting} />} />
            {!onValidationErrors && errors.horaRecoleccion ? (
              <p className="mt-1 text-xs text-red-600">{errors.horaRecoleccion.message}</p>
            ) : null}
          </div>
          {collectionDate && collectionTime && <p className="text-sm text-blue-800 md:col-span-2">Recolección: {formatDateTime(`${collectionDate}T${collectionTime}:00`)} · hora de Ciudad de México</p>}
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
          {!onValidationErrors && errors.codigoRetiroSinTarjeta ? (
            <p className="mt-1 text-xs text-red-600">{errors.codigoRetiroSinTarjeta.message}</p>
          ) : null}
        </div>
      ) : null}

      {esEfectivo ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Evidencia del importe preparado
          </label>
          <Controller
            control={control}
            name="evidenciaImportePreparado"
            rules={{
              validate: (value) =>
                !esEfectivo ||
                (value && value.length > 0) ||
                'La evidencia del importe preparado es obligatoria',
            }}
            render={({ field }) => (
              <FileUploadField
                inputId="evidencia-importe-preparado"
                value={field.value}
                onChange={field.onChange}
                selectedLabel="Evidencia seleccionada"
                dropHint="Arrastra y suelta la evidencia aquí"
              />
            )}
          />
          {!onValidationErrors && errors.evidenciaImportePreparado ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.evidenciaImportePreparado.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Foto o documento del efectivo ya contado y separado para la recolección.
            </p>
          )}
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
              <FileUploadField
                inputId="comprobante-parcialidad"
                value={field.value}
                onChange={field.onChange}
                selectedLabel="Comprobante seleccionado"
                dropHint={compactBankPanel ? 'Subir comprobante de pago' : 'Arrastra y suelta el comprobante aquí'}
              />
            )}
          />
          {!onValidationErrors && errors.comprobante ? (
            <p className="mt-1 text-xs text-red-600">{errors.comprobante.message}</p>
          ) : null}
        </div>
      ) : null}

      {(!compactBankPanel || showObservations) && <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Observaciones</label>
        <textarea
          rows={3}
          placeholder="Opcional"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
          {...register('observaciones')}
        />
      </div>}
      {compactBankPanel && !showObservations && <button type="button" onClick={() => setShowObservations(true)} className="text-xs font-semibold text-blue-600">+ Agregar observación</button>}

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && <Button variant="neutral" type="button" disabled={isSubmitting} onClick={onCancel} className="h-11 px-4">Cancelar</Button>}
        <Button variant="primary" type="submit" form={formId} isLoading={isSubmitting} className="min-w-0 flex-1 justify-center">
          {compactBankPanel ? 'Registrar retorno' : resolveInstallmentSubmitLabel({ totals, importe, esEfectivo })}
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
