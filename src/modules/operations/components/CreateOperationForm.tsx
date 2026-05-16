import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  createOperationSchema,
  type CreateOperationFormInput,
  type CreateOperationFormValues,
} from '@/modules/operations/schemas/create-operation.schema';


interface SelectOption {
  id: number;
  label: string;
}

interface CreateOperationFormProps {
  isSubmitting: boolean;
  bankAccounts: SelectOption[];
  clientes: SelectOption[];
  onSubmit: (values: CreateOperationFormValues) => Promise<void>;
}
function normalizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');

  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ?? '';

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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

export function CreateOperationForm({
    isSubmitting,
    bankAccounts,
    clientes,
    onSubmit,
}: CreateOperationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateOperationFormInput, unknown, CreateOperationFormValues>({
    resolver: zodResolver(createOperationSchema),
    defaultValues: {
      clienteId: undefined,
      montoTotal: '',
      observaciones: '',
      pagos: [
        {
          monto: '',
          tipoPago: '',
          cuentaDestinoId: undefined,
          comprobante: undefined,
          observaciones: '',
        },
      ],
    },
    mode: 'onChange',
  });
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteOptions, setShowClienteOptions] = useState(false);

  const filteredClientes = useMemo(() => {
    const search = clienteSearch.trim().toLowerCase();

    if (!search) return clientes;

    return clientes.filter((cliente) =>
      cliente.label.toLowerCase().includes(search),
    );
  }, [clientes, clienteSearch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pagos',
  });

  const montoTotalRaw = useWatch({
    control,
    name: 'montoTotal',
  });

  const pagos = useWatch({
    control,
    name: 'pagos',
  }) ?? [];

  const montoTotal = parseCurrency(montoTotalRaw);

  const totalPagos = useMemo<number>(() => {
    return pagos.reduce<number>((acc, pago) => {
      return acc + parseCurrency(pago?.monto);
    }, 0);
  }, [pagos]);

  const saldoDisponible = Math.max(montoTotal - totalPagos, 0);
  const excedeMontoTotal = totalPagos > montoTotal;
  const excedente = excedeMontoTotal ? totalPagos - montoTotal : 0;

  const handleCurrencyChange = async (
    path: `montoTotal` | `pagos.${number}.monto`,
    rawValue: string,
  ) => {
    setValue(path, normalizeCurrencyInput(rawValue), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    await trigger('pagos');
  };

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  function buildFileList(file: File): FileList {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  }

  return (
   <form className="space-y-4 pb-0" onSubmit={handleSubmit(onSubmit)}>
      <div className="sticky top-0 z-50 -mx-5 -mt-5 rounded-b-2xl border-b border-slate-200 bg-white px-5 py-4 shadow-lg before:absolute before:inset-x-0 before:-top-10 before:h-10 before:bg-white">
        <div className="relative grid items-center gap-6 text-sm md:grid-cols-4">
          <div className="text-center">
            <span className="block text-slate-500">Monto total requerido</span>
            <span className="text-base font-semibold text-slate-900">
              ${formatCurrencyDisplay(montoTotal)}
            </span>
          </div>

          <div className="text-center">
            <span className="block text-slate-500">Suma de comprobantes</span>
            <span className={excedeMontoTotal ? 'text-base font-semibold text-red-600' : 'text-base font-semibold text-slate-900'}>
              ${formatCurrencyDisplay(totalPagos)}
            </span>
          </div>

          <div className="text-center">
            <span className="block text-slate-500">
              {excedeMontoTotal ? 'Excedente' : 'Faltante'}
            </span>
            <span className={excedeMontoTotal ? 'text-base font-semibold text-red-600' : 'text-base font-semibold text-emerald-700'}>
              ${formatCurrencyDisplay(excedeMontoTotal ? excedente : saldoDisponible)}
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                append({
                  monto: '',
                  tipoPago: '',
                  cuentaDestinoId: undefined,
                  comprobante: undefined,
                  observaciones: '',
                });

                void trigger('pagos');
              }}
            >
              Registrar pago de ingreso
            </Button>
          </div>
        </div>

        {excedeMontoTotal ? (
          <div className="relative mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            La suma de los comprobantes excede el monto total de la operación por $
            {formatCurrencyDisplay(excedente)}.
          </div>
        ) : null}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 p-5">
       <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Datos generales de la operación
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre del cliente
            </label>
            <>
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onFocus={() => setShowClienteOptions(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowClienteOptions(false);
                  }, 150);
                }}
                onChange={(event) => {
                  setClienteSearch(event.target.value);
                  setShowClienteOptions(true);
                  setValue('clienteId', undefined, {
                    shouldValidate: false,
                    shouldDirty: true,
                    shouldTouch: false,
                  });
                }}
              />

              {showClienteOptions ? (
                <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredClientes.length > 0 ? (
                    filteredClientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setClienteSearch(cliente.label);

                          setValue('clienteId', cliente.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });

                          setShowClienteOptions(false);
                          void trigger('clienteId');
                        }}
                      >
                        {cliente.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            </>
          </div>

          {errors.clienteId ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.clienteId.message}
            </p>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Monto total
            </label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="1,000.00"
              error={errors.montoTotal?.message}
              {...register('montoTotal')}
              onChange={(event) => {
                void handleCurrencyChange('montoTotal', event.target.value);
              }}
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observaciones
          </label>
          <textarea
            rows={4}
            placeholder="Opcional"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            {...register('observaciones')}
          />
          {errors.observaciones ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.observaciones.message}
            </p>
          ) : null}
        </div>
      </div>
        <div className="mb-5 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Comprobantes de la operación
          </h3>
          <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-500">
            Todos los comprobantes pertenecen a la misma operación. Cada uno puede ir
            a una cuenta distinta.
          </p>
        </div>
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="space-y-4">
          {fields.map((field, index) => {
            const pagoErrors = errors.pagos?.[index];
            const pagoMonto = parseCurrency(pagos[index]?.monto);

            return (
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {index === 0 ? 'Primer pago' : `Pago adicional #${index + 1}`}
                  </h4>

                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        void trigger('pagos');
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>

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
                      error={pagoErrors?.monto?.message}
                      {...register(`pagos.${index}.monto`)}
                      onChange={(event) => {
                        void handleCurrencyChange(`pagos.${index}.monto`, event.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cuenta destino
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                      {...register(`pagos.${index}.cuentaDestinoId`, {
                        onChange: () => {
                          void trigger('pagos');
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
                    {pagoErrors?.cuentaDestinoId ? (
                      <p className="mt-1 text-xs text-red-600">
                        {pagoErrors.cuentaDestinoId.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Tipo de comprobante
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                      {...register(`pagos.${index}.tipoPago`, {
                        onChange: () => {
                          void trigger('pagos');
                        },
                      })}
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="DEPOSITO">Depósito</option>
                    </select>
                    {pagoErrors?.tipoPago ? (
                      <p className="mt-1 text-xs text-red-600">
                        {pagoErrors.tipoPago.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Imagen del comprobante
                    </label>

                    <label
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDraggingIndex(index);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        if (draggingIndex === index) {
                          setDraggingIndex(null);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDraggingIndex(null);

                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;

                        const fileList = buildFileList(file);

                        setValue(`pagos.${index}.comprobante`, fileList, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });

                        void trigger('pagos');
                      }}
                      className={`flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                        draggingIndex === index
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(event) => {
                          setValue(
                            `pagos.${index}.comprobante`,
                            event.target.files ?? undefined,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            },
                          );

                          void trigger('pagos');
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

                    {pagos[index]?.comprobante instanceof FileList &&
                    pagos[index]?.comprobante.length > 0 ? (
                      
                      <p className="mt-2 text-xs text-slate-600">
                        Archivo seleccionado:{' '}
                        <span className="font-medium text-slate-900">
                          {pagos[index]?.comprobante[0]?.name}
                        </span>
                      </p>
                    ) : null}

                    {pagoErrors?.comprobante ? (
                      <p className="mt-1 text-xs text-red-600">
                        {pagoErrors.comprobante.message as string}
                      </p>
                    ) : null}

                    {pagoMonto <= 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        El comprobante será obligatorio cuando el monto sea mayor a cero.
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
                    {...register(`pagos.${index}.observaciones`)}
                  />
                  {pagoErrors?.observaciones ? (
                    <p className="mt-1 text-xs text-red-600">
                      {pagoErrors.observaciones.message}
                    </p>
                  ) : null}
                </div>
              </div>
              </div>
            );
          })}
        </div>

        {errors.pagos?.message ? (
          <p className="mt-3 text-xs text-red-600">{errors.pagos.message}</p>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-30 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={excedeMontoTotal || !!errors.pagos?.message}
          className="w-full justify-center"
        >
          Registrar
        </Button>
      </div>
    </form>
  );
}