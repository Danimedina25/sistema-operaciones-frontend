import { formErrorMessages } from '../utils/form-error-messages';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { useId, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { FinancialSummaryCard } from '@/shared/components/ui/FinancialSummaryCard';
import { BankCombobox } from '@/shared/components/ui/BankCombobox';
import { FileUploadField } from './returns/FileUploadField';
import { formatDate } from '@/shared/utils/weeks';

interface SelectOption {
  id: number;
  label: string;
}

export interface AddOperationPaymentFormValues {
  monto: string;
  tipoPago: '' | 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
  cuentaDestinoId: string;
  fechaComprobante: string;
  numeroCheque?: string;
  bancoEmisor?: string;
  emisor?: string;
  beneficiario?: string;
  comprobante?: FileList;
  observaciones?: string;
}

interface AddOperationPaymentFormProps {
  isSubmitting: boolean;
  bankAccounts: SelectOption[];
  montoTotal: number;
  montoRegistrado: number;
  saldoPendiente: number;
  onCancel?: () => void;
  onSubmit: (values: AddOperationPaymentFormValues) => Promise<void>;
}

function normalizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ?? '';

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const formattedInteger = normalizedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );

  if (parts.length === 1) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

function parseCurrency(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AddOperationPaymentForm({
  isSubmitting,
  bankAccounts,
  montoTotal,
  montoRegistrado,
  saldoPendiente,
  onSubmit,
  onCancel,
}: AddOperationPaymentFormProps) {
  const formId = useId();
  const submitting = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<AddOperationPaymentFormValues>({
    defaultValues: {
      monto: '',
      tipoPago: '',
      cuentaDestinoId: '',
      fechaComprobante: '',
      comprobante: undefined,
      observaciones: '',
    },
    mode: 'onChange',
  });

  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const cuentaDestinoId = useWatch({
    control,
    name: 'cuentaDestinoId',
  });

  useEffect(() => {
    if (!cuentaDestinoId) return;

    const account = bankAccounts.find(
      (item) => String(item.id) === String(cuentaDestinoId),
    );

    if (account) {
      setAccountSearch(account.label);
    }
  }, [cuentaDestinoId, bankAccounts]);

  const filteredAccounts = useMemo(() => {
    const search = accountSearch.trim().toLowerCase();

    if (!search) return bankAccounts;

    return bankAccounts.filter((account) =>
      account.label.toLowerCase().includes(search),
    );
  }, [bankAccounts, accountSearch]);

  const montoRaw = useWatch({
    control,
    name: 'monto',
  });

  const tipoPago = useWatch({
    control,
    name: 'tipoPago',
  });

  const requiereCuenta = tipoPago === 'TRANSFERENCIA' || tipoPago === 'DEPOSITO';

  const requiereComprobante = true;

  const montoCapturado = parseCurrency(montoRaw);
  const excedeSaldoPendiente = montoCapturado > saldoPendiente;
  const excedente = excedeSaldoPendiente ? montoCapturado - saldoPendiente : 0;
  const faltanteDespuesDelPago = Math.max(saldoPendiente - montoCapturado, 0);

  const montoErrorMessage = useMemo(() => {
    if (errors.monto?.message) {
      return errors.monto.message;
    }

    if (excedeSaldoPendiente) {
      return `El monto no puede exceder el saldo pendiente de ${formatCurrencyDisplay(
        saldoPendiente,
      )}`;
    }

    return undefined;
  }, [errors.monto?.message, excedeSaldoPendiente, saldoPendiente]);

  async function submitPayment(values: AddOperationPaymentFormValues) {
    if (isSubmitting || submitting.current) return;
    submitting.current = true; setSubmitError('');
    try { await onSubmit(values); } catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { submitting.current = false; }
  }

  return (
    <form id={formId} className="space-y-6" onChange={() => { if (submitError) setSubmitError(''); }} onSubmit={handleSubmit(submitPayment)}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
      <input type="hidden" {...register('cuentaDestinoId', {
        validate: (value, values) => !['TRANSFERENCIA', 'DEPOSITO'].includes(values.tipoPago)
          || (Number.isInteger(Number(value)) && Number(value) > 0)
          || 'Selecciona una cuenta bancaria',
      })} />
      <FinancialSummaryCard label="Resumen del ingreso"
        metrics={[
          { label: 'Monto total requerido', value: `$${formatCurrencyDisplay(montoTotal)}`, tone: 'blue' },
          { label: 'Monto registrado', value: `$${formatCurrencyDisplay(montoRegistrado)}`, tone: 'green' },
          { label: 'Faltante actual', value: `$${formatCurrencyDisplay(saldoPendiente)}`, tone: saldoPendiente > 0 ? 'amber' : 'neutral' },
        ]}
        errors={submitError ? [submitError] : [...formErrorMessages({ ...errors, monto: excedeSaldoPendiente ? undefined : errors.monto }), ...(excedeSaldoPendiente ? [`El monto del comprobante excede el saldo disponible por $${formatCurrencyDisplay(excedente)}.`] : [])]} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 lg:contents">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Monto del comprobante
            </label>

            <div className="relative"><Input
              type="text"
              inputMode="decimal"
              placeholder="1,000.00"
              className="pr-32"
              aria-invalid={!!montoErrorMessage || undefined}
              {...register('monto', {
                required: 'El monto es obligatorio',
                validate: (value) => {
                  const parsed = Number(value.replace(/,/g, ''));

                  if (Number.isNaN(parsed) || parsed <= 0) {
                    return 'El monto debe ser mayor a cero';
                  }

                  if (parsed > saldoPendiente) {
                    return `El monto no puede exceder el saldo pendiente de ${formatCurrencyDisplay(
                      saldoPendiente,
                    )}`;
                  }

                  return true;
                },
                onChange: (event) => {
                  setValue('monto', normalizeCurrencyInput(event.target.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                },
              })}
            /><button type="button" onClick={() => setValue('monto', formatCurrencyDisplay(saldoPendiente), { shouldValidate: true, shouldDirty: true })} className="absolute right-2 top-2 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">Registrar todo</button></div>
            {montoCapturado > 0 && <p className="mt-1 text-xs text-emerald-700">Después de este pago faltará: ${formatCurrencyDisplay(faltanteDespuesDelPago)}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de comprobante
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('tipoPago', {
                required: 'El tipo de comprobante es obligatorio',
                onChange: async (event) => {
                  if (['EFECTIVO', 'CHEQUE'].includes(event.target.value)) {
                    setValue('cuentaDestinoId', '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setAccountSearch('');
                  }

                  await trigger('comprobante');
                  await trigger('cuentaDestinoId');
                },
              })}
            >
              <option value="">Selecciona un tipo</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="CHEQUE">Cheque</option>
            </select>


          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha del comprobante
            </label>

            <input
              type="date"
              max={formatDate(new Date())}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('fechaComprobante', {
                required: 'La fecha del comprobante es obligatoria',
              })}
            />


          </div>

          {tipoPago === 'CHEQUE' && <div className="space-y-3"><p className="text-sm text-slate-600">El negocio definirá el destino al gestionar el cobro.</p>
            <label className="block">Número de cheque<input className="block w-full rounded border p-2" {...register('numeroCheque', { validate: (value, values) => values.tipoPago !== 'CHEQUE' || !!value?.trim() || 'Este dato del cheque es obligatorio' })} /></label>
            <Controller
              name="bancoEmisor"
              control={control}
              rules={{ validate: (value, values) => values.tipoPago !== 'CHEQUE' || !!value?.trim() || 'Este dato del cheque es obligatorio' }}
              render={({ field }) => (
                <BankCombobox
                  label="Banco emisor"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <label className="block">Emisor del cheque<input className="block w-full rounded border p-2" {...register('emisor', { validate: (value, values) => values.tipoPago !== 'CHEQUE' || !!value?.trim() || 'Este dato del cheque es obligatorio' })} /></label>
            <label className="block">Beneficiario<input className="block w-full rounded border p-2" {...register('beneficiario', { validate: (value, values) => values.tipoPago !== 'CHEQUE' || !!value?.trim() || 'Este dato del cheque es obligatorio' })} /></label>
          </div>}
          {requiereCuenta ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cuenta destino
              </label>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar cuenta..."
                  value={accountSearch}
                  onFocus={() => setShowAccountOptions(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowAccountOptions(false);
                    }, 150);
                  }}
                  onChange={(event) => {
                    setAccountSearch(event.target.value);

                    setValue('cuentaDestinoId', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                      shouldValidate: false,
                    });

                    setShowAccountOptions(true);
                  }}
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

                            setValue(
                              'cuentaDestinoId',
                              String(account.id),
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              },
                            );

                            setShowAccountOptions(false);

                            void trigger('cuentaDestinoId');
                          }}
                        >
                          {account.label}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No se encontraron cuentas
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Comprobante de pago
            </label>

            <Controller
              control={control}
              name="comprobante"
              rules={{
                validate: (value) => {
                  if (!requiereComprobante) return true;

                  return value && value.length > 0
                    ? true
                    : 'El comprobante es obligatorio';
                },
              }}
              render={({ field }) => <FileUploadField value={field.value} onChange={field.onChange}
                inputId="comprobante-ingreso" selectedLabel="Comprobante seleccionado"
                dropHint="Arrastra o sube el comprobante" />}
            />


          </div>
        </div>

        <details className="lg:col-span-2"><summary className="cursor-pointer text-xs font-semibold text-blue-600">+ Agregar observación</summary><label className="mt-3 block text-sm font-medium text-slate-700">Observaciones<textarea rows={3} placeholder="Opcional" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900" {...register('observaciones')} /></label></details>
      </div>

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && <Button type="button" variant="neutral" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary"
          type="submit" form={formId}
          isLoading={isSubmitting}
          disabled={excedeSaldoPendiente}
          className="min-w-0 flex-1 justify-center"
        >
          Registrar pago
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
