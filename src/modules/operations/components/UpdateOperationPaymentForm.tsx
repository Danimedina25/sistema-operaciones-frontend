import { formErrorMessages } from '../utils/form-error-messages';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { ReceiptViewerLink } from '@/shared/components/ui/ReceiptViewerLink';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { FileUploadField } from './returns/FileUploadField';
import { BankCombobox } from '@/shared/components/ui/BankCombobox';
import { formatDate } from '@/shared/utils/weeks';
import { PaymentOperationResponse, OperationPaymentResponse } from '../types/operations.types.ts';


interface SelectOption {
  id: number;
  label: string;
}

export interface UpdateOperationPaymentFormValues {
  monto: number;
  tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
  fechaComprobante: string;
  cuentaDestinoId: number | null;
  numeroCheque?: string;
  bancoEmisor?: string;
  emisor?: string;
  beneficiario?: string;
  comprobante?: FileList;
  observaciones?: string;
}

interface UpdateOperationPaymentFormInput {
  monto: string;
  tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';
  fechaComprobante: string;
  cuentaDestinoId: string;
  numeroCheque?: string;
  bancoEmisor?: string;
  emisor?: string;
  beneficiario?: string;
  comprobante?: FileList;
  observaciones?: string;
}
interface UpdateOperationPaymentFormProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  bankAccounts: SelectOption[];
  operation: PaymentOperationResponse;
  payment: OperationPaymentResponse;
  onSubmit: (
    values: UpdateOperationPaymentFormValues,
  ) => Promise<void>;
}

function normalizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ?? '';
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (parts.length === 1) return formattedInteger;

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

function parseCurrency(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}
function toDateInputValue(value?: string | null) {
  if (!value) return '';

  return value.split('T')[0];
}
function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isImageUrl(url?: string | null) {
  if (!url) return false;

  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url.split('?')[0]);
}

export function UpdateOperationPaymentForm({
  isSubmitting,
  bankAccounts,
  operation,
  payment,
  onSubmit,
  onCancel,
}: UpdateOperationPaymentFormProps) {
  const formId = useId();
  const submitting = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UpdateOperationPaymentFormInput>({
    defaultValues: {
      monto: formatCurrencyDisplay(payment.monto),
      tipoPago: payment.tipoPago as UpdateOperationPaymentFormInput['tipoPago'],
      fechaComprobante: toDateInputValue(payment.fechaComprobante),
      numeroCheque: payment.numeroCheque ?? '',
      bancoEmisor: payment.bancoEmisor ?? '',
      emisor: payment.emisor ?? '',
      beneficiario: payment.beneficiario ?? '',
      cuentaDestinoId: payment.cuentaDestinoId ? String(payment.cuentaDestinoId) : '',
      comprobante: undefined,
      // En un pago rechazado, observaciones guarda el motivo del rechazo, no una nota del Socio.
      observaciones: payment.estatus === 'RECHAZADA' ? '' : payment.observaciones ?? '',
    },
    mode: 'onChange',
  });

  const montoRaw = useWatch({
    control,
    name: 'monto',
  });

  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountOptions, setShowAccountOptions] = useState(false);

  const cuentaDestinoId = useWatch({
    control,
    name: 'cuentaDestinoId',
  });

  const filteredAccounts = useMemo(() => {
    const search = accountSearch.trim().toLowerCase();

    if (!search) return bankAccounts;

    return bankAccounts.filter((account) =>
      account.label.toLowerCase().includes(search),
    );
  }, [bankAccounts, accountSearch]);

  useEffect(() => {
    if (!cuentaDestinoId) return;

    const account = bankAccounts.find(
      (item) => String(item.id) === String(cuentaDestinoId),
    );

    if (account) {
      setAccountSearch(account.label);
    }
  }, [cuentaDestinoId, bankAccounts]);

  const currentReceiptIsImage = isImageUrl(payment.comprobanteUrl);

  const tipoPago = useWatch({
    control,
    name: 'tipoPago',
  });

  const requiereComprobante =
    tipoPago === 'TRANSFERENCIA' || tipoPago === 'DEPOSITO' || tipoPago === 'CHEQUE';

  const requiereCuenta = tipoPago === 'TRANSFERENCIA' || tipoPago === 'DEPOSITO';

  const montoCapturado = parseCurrency(montoRaw);

  // Un pago rechazado ya no cuenta como registrado: el faltante ya incluye su monto.
  const saldoDisponibleParaEstePago =
    operation.saldoPendientePorRegistrar + (payment.estatus === 'RECHAZADA' ? 0 : payment.monto);

  const excedeSaldoDisponible = montoCapturado > saldoDisponibleParaEstePago;

  const excedente = excedeSaldoDisponible
    ? montoCapturado - saldoDisponibleParaEstePago
    : 0;

  const faltanteDespuesDelPago = Math.max(
    saldoDisponibleParaEstePago - montoCapturado,
    0,
  );

  const montoErrorMessage = useMemo(() => {
    if (errors.monto?.message) {
      return errors.monto.message;
    }

    if (excedeSaldoDisponible) {
      return `El monto no puede exceder el saldo disponible de ${formatCurrencyDisplay(
        saldoDisponibleParaEstePago,
      )}`;
    }

    return undefined;
  }, [
    errors.monto?.message,
    excedeSaldoDisponible,
    saldoDisponibleParaEstePago,
  ]);

  const handleSubmitForm = async (
    values: UpdateOperationPaymentFormInput,
  ) => {
    if (!values.tipoPago || isSubmitting || submitting.current) return;
    submitting.current = true; setSubmitError('');
    try {

    await onSubmit({
      monto: parseCurrency(values.monto),
      numeroCheque: values.tipoPago === 'CHEQUE' ? values.numeroCheque?.trim() : undefined,
      bancoEmisor: values.tipoPago === 'CHEQUE' ? values.bancoEmisor?.trim() : undefined,
      emisor: values.tipoPago === 'CHEQUE' ? values.emisor?.trim() : undefined,
      beneficiario: values.tipoPago === 'CHEQUE' ? values.beneficiario?.trim() : undefined,

      cuentaDestinoId:
        values.tipoPago === 'CHEQUE'
          ? null
          : values.tipoPago === 'EFECTIVO' ? 0
          : Number(values.cuentaDestinoId),
      tipoPago: values.tipoPago,
      fechaComprobante: values.fechaComprobante,
      comprobante: values.comprobante,
      observaciones: values.observaciones,
    });
    } catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { submitting.current = false; }
  };

  return (
    <form id={formId} className="space-y-6" onChange={() => { if (submitError) setSubmitError(''); }} onSubmit={handleSubmit(handleSubmitForm)}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
      <input type="hidden" {...register('cuentaDestinoId', {
        validate: (value, values) => !['TRANSFERENCIA', 'DEPOSITO'].includes(values.tipoPago)
          || (Number.isInteger(Number(value)) && Number(value) > 0)
          || 'Selecciona una cuenta bancaria',
      })} />
      {payment.estatus === 'RECHAZADA' && (
        <section aria-label="Motivo del rechazo" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Comprobante rechazado{payment.validadoPorNombre ? ` por ${payment.validadoPorNombre}` : ''}</p>
          <p className="mt-1">{payment.observaciones || 'Sin motivo registrado.'}</p>
          <p className="mt-2 text-xs text-red-700">Corrige los datos o sube un comprobante nuevo. Al guardar, el pago vuelve a validación.</p>
        </section>
      )}
      <section aria-label="Resumen del ingreso" className="sticky top-0 z-10 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-slate-500">Monto total requerido</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(operation.montoTotal)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Monto registrado</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(operation.montoRegistrado)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Disponible para este pago</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(saldoDisponibleParaEstePago)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Faltante después del cambio</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(faltanteDespuesDelPago)}
          </span>
        </div>
      </div>


        <div aria-live="polite">
          {(submitError ? [submitError] : [...formErrorMessages({ ...errors, monto: excedeSaldoDisponible ? undefined : errors.monto }), ...(excedeSaldoDisponible ? [`El monto del comprobante excede el saldo disponible por $${formatCurrencyDisplay(excedente)}.`] : [])]).map(message => <p key={message} role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Monto del comprobante
            </label>

            <Input
              type="text"
              inputMode="decimal"
              placeholder="1,000.00"
              aria-invalid={!!montoErrorMessage || undefined}
              {...register('monto', {
                required: 'El monto es obligatorio',
                validate: (value) => {
                  const parsed = Number(value.replace(/,/g, ''));

                  if (Number.isNaN(parsed) || parsed <= 0) {
                    return 'El monto debe ser mayor a cero';
                  }

                  if (parsed > saldoDisponibleParaEstePago) {
                    return `El monto no puede exceder el saldo disponible de ${formatCurrencyDisplay(
                      saldoDisponibleParaEstePago,
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
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de comprobante
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('tipoPago', {
                required: 'El tipo de comprobante es obligatorio',
                onChange: (event) => {
                  if (['EFECTIVO', 'CHEQUE'].includes(event.target.value)) {
                    setValue('cuentaDestinoId', '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setAccountSearch('');
                  }
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

        <div className="space-y-4">
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

                  if (payment.comprobanteUrl) return true;

                  return value && value.length > 0
                    ? true
                    : 'El comprobante es obligatorio';
                },
              }}
              render={({ field }) => <div className="space-y-3">
                {payment.comprobanteUrl && !field.value?.length && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {currentReceiptIsImage && <img src={payment.comprobanteUrl} alt="Comprobante actual"
                      className="size-16 shrink-0 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Comprobante actual</p>
                      <ReceiptViewerLink href={payment.comprobanteUrl}
                        className="text-xs font-medium text-[#3b6ef5]">Ver comprobante</ReceiptViewerLink>
                    </div>
                  </div>
                )}
                <FileUploadField inputId="cambiar-comprobante-pago" value={field.value}
                  onChange={field.onChange} selectedLabel="Nuevo comprobante seleccionado"
                  dropHint="Arrastra o sube un nuevo comprobante" />
              </div>}
            />


          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observaciones
          </label>

          <textarea
            rows={3}
            placeholder="Opcional"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            {...register('observaciones')}
          />
        </div>
      </div>

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && <Button type="button" variant="neutral" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary"
          type="submit" form={formId}
          isLoading={isSubmitting}
          disabled={excedeSaldoDisponible}
          className="min-w-0 flex-1 justify-center"
        >
          Guardar cambios
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
