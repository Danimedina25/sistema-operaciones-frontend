import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { PaymentOperationResponse, OperationPaymentResponse } from '../types/operations.types.ts';


interface SelectOption {
  id: number;
  label: string;
}

export interface UpdateOperationPaymentFormValues {
  monto: number;
  tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';
  cuentaDestinoId: number;
  comprobante?: FileList;
  observaciones?: string;
}

interface UpdateOperationPaymentFormInput {
  monto: string;
  tipoPago: '' | 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';
  cuentaDestinoId: string;
  comprobante?: FileList;
  observaciones?: string;
}

interface UpdateOperationPaymentFormProps {
  isSubmitting: boolean;
  bankAccounts: SelectOption[];
  operation: PaymentOperationResponse;
  payment: OperationPaymentResponse;
  onSubmit: (
    values: UpdateOperationPaymentFormValues,
    comprobanteUrl: string,
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

function isImageFile(file?: File | null) {
  if (!file) return false;

  return file.type.startsWith('image/');
}

export function UpdateOperationPaymentForm({
  isSubmitting,
  bankAccounts,
  operation,
  payment,
  onSubmit,
}: UpdateOperationPaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
 } = useForm<UpdateOperationPaymentFormInput>({
    defaultValues: {
      monto: formatCurrencyDisplay(payment.monto),
      tipoPago: payment.tipoPago,
      cuentaDestinoId: String(payment.cuentaDestinoId),
      comprobante: undefined,
      observaciones: payment.observaciones ?? '',
    },
    mode: 'onChange',
  });

  const [isDragging, setIsDragging] = useState(false);

  const montoRaw = useWatch({
    control,
    name: 'monto',
  });

  const comprobante = useWatch({
    control,
    name: 'comprobante',
  });

  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);

    const selectedFile =
    comprobante instanceof FileList && comprobante.length > 0
        ? comprobante[0]
        : null;

    const currentReceiptIsImage = isImageUrl(payment.comprobanteUrl);
    const selectedReceiptIsImage = isImageFile(selectedFile);

    useEffect(() => {
    if (!selectedFile || !selectedReceiptIsImage) {
        setSelectedPreviewUrl(null);
        return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedPreviewUrl(objectUrl);

    return () => {
        URL.revokeObjectURL(objectUrl);
    };
    }, [selectedFile, selectedReceiptIsImage]);

  const tipoPago = useWatch({
    control,
    name: 'tipoPago',
    });

const requiereComprobante =
  tipoPago === 'TRANSFERENCIA' || tipoPago === 'DEPOSITO';

const esEfectivo = tipoPago === 'EFECTIVO';

  const montoCapturado = parseCurrency(montoRaw);

  const saldoDisponibleParaEstePago =
    operation.saldoPendientePorRegistrar + payment.monto;

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

  function buildFileList(file: File): FileList {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  }

    const handleSubmitForm = async (values: UpdateOperationPaymentFormInput) => {
    if (!values.tipoPago) return;

    await onSubmit(
        {
        monto: parseCurrency(values.monto),
        cuentaDestinoId: values.tipoPago === 'EFECTIVO'
            ? payment.cuentaDestinoId
            : Number(values.cuentaDestinoId),
        tipoPago: values.tipoPago,
        comprobante: values.comprobante,
        observaciones: values.observaciones,
        },
        values.tipoPago === 'EFECTIVO' ? payment.comprobanteUrl : payment.comprobanteUrl,
    );
    };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleSubmitForm)}>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4">
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

      {excedeSaldoDisponible ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          El monto del comprobante excede el saldo disponible por $
          {formatCurrencyDisplay(excedente)}.
        </div>
      ) : null}

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
              error={montoErrorMessage}
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
            {!esEfectivo ? (
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Cuenta destino
                </label>

                <select
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                {...register('cuentaDestinoId', {
                    validate: (value) => {
                    if (!requiereComprobante) return true;
                    return Number(value) > 0 || 'La cuenta destino es obligatoria';
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

                {errors.cuentaDestinoId ? (
                <p className="mt-1 text-xs text-red-600">
                    {errors.cuentaDestinoId.message}
                </p>
                ) : null}
            </div>
            ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de comprobante
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('tipoPago', {
                required: 'El tipo de comprobante es obligatorio',
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
        </div>

        <div className="space-y-4">
            <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
                Comprobante de pago
            </label>

            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {selectedPreviewUrl ? (
                    <img
                        src={selectedPreviewUrl}
                        alt="Nuevo comprobante seleccionado"
                        className="h-full w-full object-cover"
                    />
                    ) : currentReceiptIsImage ? (
                    <img
                        src={payment.comprobanteUrl}
                        alt="Comprobante actual"
                        className="h-full w-full object-cover"
                    />
                    ) : (
                    <span className="px-2 text-center text-xs font-medium text-slate-500">
                        Archivo actual
                    </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                    {selectedPreviewUrl
                        ? 'Nuevo comprobante seleccionado'
                        : 'Comprobante actual'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                    {selectedFile
                        ? selectedFile.name
                        : currentReceiptIsImage
                        ? 'Imagen guardada actualmente'
                        : 'El comprobante actual puede ser PDF u otro archivo'}
                    </p>

                    <a
                    href={selectedPreviewUrl ?? payment.comprobanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                    Ver comprobante
                    </a>
                </div>
                </div>
            </div>

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
                        Arrastra un nuevo comprobante aquí
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        o haz clic para reemplazar el comprobante
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                        Si no seleccionas archivo, se conservará el actual
                    </p>
                    </label>

                    {selectedFile ? (
                    <p className="mt-2 text-xs text-slate-600">
                        Nuevo archivo seleccionado:{' '}
                        <span className="font-medium text-slate-900">
                        {selectedFile.name}
                        </span>
                    </p>
                    ) : null}
                </>
                )}
            />

            {errors.comprobante ? (
                <p className="mt-1 text-xs text-red-600">
                {errors.comprobante.message as string}
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
          disabled={excedeSaldoDisponible}
          className="w-full justify-center"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}