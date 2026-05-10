import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

interface SelectOption {
  id: number;
  label: string;
}

export interface AddReturnPaymentFormValues {
  monto: string;
  tipoPago: '' | 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';
  cuentaOrigenId: string;
  cuentaDestinoCliente: string;
  comprobante?: FileList;
  observaciones?: string;
}

interface AddReturnPaymentFormProps {
  isSubmitting: boolean;
  bankAccounts: SelectOption[];
  montoTotalDevolver: number;
  saldoPendiente: number;
  onSubmit: (values: AddReturnPaymentFormValues) => Promise<void>;
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

function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AddReturnPaymentForm({
  isSubmitting,
  bankAccounts,
  montoTotalDevolver,
  saldoPendiente,
  onSubmit,
}: AddReturnPaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddReturnPaymentFormValues>({
    defaultValues: {
      monto: '',
      tipoPago: '',
      cuentaOrigenId: '',
      cuentaDestinoCliente: '',
      comprobante: undefined,
      observaciones: '',
    },
    mode: 'onChange',
  });

  const [isDragging, setIsDragging] = useState(false);

  const montoRaw = useWatch({
    control,
    name: 'monto',
  });

  const tipoPago = useWatch({
    control,
    name: 'tipoPago',
  });

  const comprobante = useWatch({
    control,
    name: 'comprobante',
  });

  const isCash = tipoPago === 'EFECTIVO';

  const montoCapturado = parseCurrency(montoRaw);
  const excedeSaldoPendiente = montoCapturado > saldoPendiente;
  const excedente = excedeSaldoPendiente ? montoCapturado - saldoPendiente : 0;
  const faltanteDespuesDelRetorno = Math.max(saldoPendiente - montoCapturado, 0);

  const montoErrorMessage = useMemo(() => {
    if (errors.monto?.message) return errors.monto.message;

    if (excedeSaldoPendiente) {
      return `El monto no puede exceder el saldo pendiente de ${formatCurrencyDisplay(
        saldoPendiente,
      )}`;
    }

    return undefined;
  }, [errors.monto?.message, excedeSaldoPendiente, saldoPendiente]);

  function buildFileList(file: File): FileList {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
        <div>
          <span className="block text-slate-500">Monto total a devolver</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(montoTotalDevolver)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Pendiente actual</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(saldoPendiente)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Pendiente después del retorno</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(faltanteDespuesDelRetorno)}
          </span>
        </div>
      </div>

      {excedeSaldoPendiente ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          El monto del retorno excede el saldo pendiente por $
          {formatCurrencyDisplay(excedente)}.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Monto del retorno
            </label>

            <Input
              type="text"
              inputMode="decimal"
              placeholder="1,000.00"
              error={montoErrorMessage}
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
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de retorno
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('tipoPago', {
                required: 'El tipo de retorno es obligatorio',
                onChange: (event) => {
                  if (event.target.value === 'EFECTIVO') {
                    setValue('cuentaOrigenId', '');
                    setValue('cuentaDestinoCliente', '');
                    setValue('comprobante', undefined);
                  }
                },
              })}
            >
              <option value="">Selecciona un tipo</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="DEPOSITO">Depósito</option>
            </select>

            {errors.tipoPago ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.tipoPago.message}
              </p>
            ) : null}
          </div>

          {!isCash ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cuenta origen
                </label>

                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  {...register('cuentaOrigenId', {
                    validate: (value) => {
                      if (isCash) return true;
                      return Number(value) > 0 || 'La cuenta origen es obligatoria';
                    },
                  })}
                >
                  <option value="">Selecciona una cuenta</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label}
                    </option>
                  ))}
                </select>

                {errors.cuentaOrigenId ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.cuentaOrigenId.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Cuenta destino del cliente / CLABE
                </label>

                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Cuenta o CLABE del cliente"
                    error={errors.cuentaDestinoCliente?.message}
                    {...register('cuentaDestinoCliente', {
                    validate: (value) => {
                        if (isCash) return true;

                        const cleaned = value.replace(/\s/g, '');

                        if (!cleaned) {
                        return 'La cuenta destino del cliente es obligatoria';
                        }

                        if (!/^\d+$/.test(cleaned)) {
                        return 'La cuenta o CLABE solo debe contener números';
                        }

                        if (cleaned.length !== 10 && cleaned.length !== 18) {
                        return 'Captura una cuenta de 10 dígitos o una CLABE de 18 dígitos';
                        }

                        return true;
                    },
                    onChange: (event) => {
                        const value = event.target.value.replace(/\D/g, '').slice(0, 18);

                        setValue('cuentaDestinoCliente', value, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                        });
                    },
                    })}
                />
                </div>
            </>
          ) : (
           null
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Comprobante de retorno {!isCash ? <span className="text-red-600">*</span> : null}
            </label>

            <Controller
              control={control}
              name="comprobante"
              rules={{
                validate: (value) => {
                  if (isCash) return true;

                  return value && value.length > 0
                    ? true
                    : 'El comprobante es obligatorio';
                },
              }}
              render={({ field }) => (
                <>
                  <label
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDragging(false);

                      const file = event.dataTransfer.files?.[0];
                      if (!file) return;

                      const fileList = buildFileList(file);
                      field.onChange(fileList);
                    }}
                    className={`flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                      isDragging
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(event) => {
                        field.onChange(event.target.files ?? undefined);
                      }}
                    />

                    <p className="text-sm font-medium text-slate-700">
                      Arrastra y suelta el comprobante aquí
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      o haz clic para seleccionar un archivo
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      PDF, JPG, JPEG, PNG o WEBP
                    </p>
                  </label>

                  {comprobante instanceof FileList && comprobante.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Archivo seleccionado:{' '}
                      <span className="font-medium text-slate-900">
                        {comprobante[0]?.name}
                      </span>
                    </p>
                  ) : null}
                </>
              )}
            />

            {errors.comprobante ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.comprobante.message}
              </p>
            ) : null}
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

      <div className="w-full">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={excedeSaldoPendiente}
          className="w-full justify-center"
        >
          Registrar retorno
        </Button>
      </div>
    </form>
  );
}