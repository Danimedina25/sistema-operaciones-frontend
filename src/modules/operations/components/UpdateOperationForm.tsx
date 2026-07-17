import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { searchClientes } from '@/modules/clientes/api/clientes.api';
import {
  updateOperationSchema,
  type UpdateOperationFormInput,
  type UpdateOperationFormValues,
} from '@/modules/operations/schemas/update-operation.schema';
import { PaymentOperationResponse } from '../types/operations.types.ts';
import { useAuth } from '@/modules/auth/store/auth.context.js';

interface SelectOption {
  id: number;
  label: string;
  nivelesRedComercial?: number;
  porcentajeComisionOficina?: number;
  porcentajeComisionSocio?: number;
}

interface CommercialPartnerOption {
  id: number;
  nombre: string;
}

interface UpdateOperationFormProps {
  operation: PaymentOperationResponse;
  isSubmitting: boolean;
  clientes: SelectOption[];
  commercialPartners: CommercialPartnerOption[];
  onSubmit: (values: UpdateOperationFormValues) => Promise<void>;
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

function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function UpdateOperationForm({
  operation,
  isSubmitting,
  clientes,
  commercialPartners,
  onSubmit,
}: UpdateOperationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateOperationFormInput, unknown, UpdateOperationFormValues>({
    resolver: zodResolver(updateOperationSchema),
    defaultValues: {
      clienteId: operation.clienteId,
      montoTotal: formatCurrencyDisplay(operation.montoTotal),
      observaciones: operation.observaciones ?? '',
      socioComercialNivel2Id:
        operation.socioComercialNivel2Id ?? undefined,
      socioComercialNivel3Id:
        operation.socioComercialNivel3Id ?? undefined,
      nivelesRedComercial: operation.nivelesRedComercial,
      porcentajeComisionOficina: operation.porcentajeComisionOficina,
      porcentajeComisionSocio: operation.porcentajeComisionSocio,
      porcentajeComisionSocioNivel2: operation.porcentajeComisionSocioNivel2 ?? undefined,
      porcentajeComisionSocioNivel3: operation.porcentajeComisionSocioNivel3 ?? undefined,
    },
    mode: 'onChange',
  });

  const { user, hasRole } = useAuth();
  const canEditCommission = hasRole(['ADMIN', 'GERENTE', 'DIRECCION']);

  const [clienteSearch, setClienteSearch] = useState(
    operation.clienteNombre,
  );

  const [showClienteOptions, setShowClienteOptions] = useState(false);

  const nivelesRedComercialRaw = useWatch({
    control,
    name: 'nivelesRedComercial',
  });

  const nivelesRedComercial = Number(nivelesRedComercialRaw) || 1;

  const porcentajeComisionOficinaRaw = useWatch({
    control,
    name: 'porcentajeComisionOficina',
  });

  const porcentajeComisionSocioRaw = useWatch({
    control,
    name: 'porcentajeComisionSocio',
  });

  const porcentajeComisionSocioNivel2Raw = useWatch({
    control,
    name: 'porcentajeComisionSocioNivel2',
  });

  const porcentajeComisionSocioNivel3Raw = useWatch({
    control,
    name: 'porcentajeComisionSocioNivel3',
  });

  const montoTotalRaw = useWatch({
    control,
    name: 'montoTotal',
  });

  const comisionPreview = useMemo(() => {
    const oficina = Number(porcentajeComisionOficinaRaw) || 0;
    const nivel1 = Number(porcentajeComisionSocioRaw) || 0;
    const nivel2 = nivelesRedComercial >= 2 ? Number(porcentajeComisionSocioNivel2Raw) || 0 : 0;
    const nivel3 = nivelesRedComercial >= 3 ? Number(porcentajeComisionSocioNivel3Raw) || 0 : 0;
    const total = oficina + nivel1 + nivel2 + nivel3;
    const montoTotal = Number(String(montoTotalRaw).replace(/,/g, '')) || 0;

    return {
      total,
      monto: (montoTotal * total) / 100,
    };
  }, [
    porcentajeComisionOficinaRaw,
    porcentajeComisionSocioRaw,
    porcentajeComisionSocioNivel2Raw,
    porcentajeComisionSocioNivel3Raw,
    nivelesRedComercial,
    montoTotalRaw,
  ]);

  const filteredClientes = useMemo(() => {
    const search = clienteSearch.trim().toLowerCase();

    if (!search) return clientes;

    return clientes.filter((cliente) =>
      cliente.label.toLowerCase().includes(search),
    );
  }, [clientes, clienteSearch]);

  const [otrosClientesResultados, setOtrosClientesResultados] = useState<
    SelectOption[]
  >([]);

  const [isSearchingOtrosClientes, setIsSearchingOtrosClientes] =
    useState(false);

  useEffect(() => {
    const search = clienteSearch.trim();

    if (search.length < 2 || filteredClientes.length > 0) {
      setOtrosClientesResultados([]);
      setIsSearchingOtrosClientes(false);
      return;
    }

    setIsSearchingOtrosClientes(true);

    const timeoutId = setTimeout(() => {
      searchClientes(search)
        .then((results) => {
          setOtrosClientesResultados(
            results.map((cliente) => ({
              id: cliente.id,
              label: cliente.nombre,
              nivelesRedComercial: cliente.nivelesRedComercial,
              porcentajeComisionOficina: cliente.porcentajeComisionOficina,
              porcentajeComisionSocio: cliente.porcentajeComisionSocio,
            })),
          );
        })
        .catch(() => {
          setOtrosClientesResultados([]);
        })
        .finally(() => {
          setIsSearchingOtrosClientes(false);
        });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clienteSearch, filteredClientes.length]);

  function selectCliente(cliente: SelectOption) {
    setClienteSearch(cliente.label);

    setValue('clienteId', cliente.id, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    if (cliente.porcentajeComisionOficina !== undefined) {
      setValue('porcentajeComisionOficina', cliente.porcentajeComisionOficina, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }

    if (cliente.porcentajeComisionSocio !== undefined) {
      setValue('porcentajeComisionSocio', cliente.porcentajeComisionSocio, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue('porcentajeComisionSocioNivel2', cliente.porcentajeComisionSocio, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue('porcentajeComisionSocioNivel3', cliente.porcentajeComisionSocio, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }

    setShowClienteOptions(false);
  }

  const socioComercialNivel2Id = useWatch({
    control,
    name: 'socioComercialNivel2Id',
  });

  const socioComercialNivel3Id = useWatch({
    control,
    name: 'socioComercialNivel3Id',
  });

  const sociosNivel2Disponibles = useMemo(() => {
    return commercialPartners.filter(
      (partner) => String(partner.id) !== String(socioComercialNivel3Id),
    );
  }, [commercialPartners, socioComercialNivel3Id]);

  const sociosNivel3Disponibles = useMemo(() => {
    return commercialPartners.filter(
      (partner) => String(partner.id) !== String(socioComercialNivel2Id),
    );
  }, [commercialPartners, socioComercialNivel2Id]);

  const handleCurrencyChange = (rawValue: string) => {
    setValue('montoTotal', normalizeCurrencyInput(rawValue), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const esAdmin = user?.roles.includes('ADMIN');

  const esSocioComercialNivel1DeLaOperacion =
    user?.userId === operation.socioComercialId;

  const puedeEditarRedComercial =
    esAdmin && esSocioComercialNivel1DeLaOperacion;

  function onInvalid(formErrors: Record<string, unknown>) {
    const fieldLabels: Record<string, string> = {
      clienteId: 'Cliente',
      montoTotal: 'Monto total',
      nivelesRedComercial: 'Niveles de socios comerciales',
      socioComercialNivel2Id: 'Socio comercial nivel 2',
      socioComercialNivel3Id: 'Socio comercial nivel 3',
      porcentajeComisionOficina: 'Comisión de oficina',
      porcentajeComisionSocio: 'Comisión socio nivel 1',
      porcentajeComisionSocioNivel2: 'Comisión socio nivel 2',
      porcentajeComisionSocioNivel3: 'Comisión socio nivel 3',
      observaciones: 'Observaciones',
    };

    const friendly = Object.keys(formErrors)
      .map((key) => fieldLabels[key] ?? key)
      .join(', ');

    toast.error(
      friendly
        ? `Revisa el formulario, hay campos obligatorios sin completar: ${friendly}.`
        : 'Revisa el formulario, hay campos obligatorios sin completar.',
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <div className="rounded-2xl border border-slate-200 p-5">
        <h3 className="mb-4 text-base font-semibold text-slate-900">
          Datos generales de la operación
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre del cliente
            </label>

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

                  setValue('clienteId', undefined as never, {
                    shouldValidate: false,
                    shouldDirty: true,
                  });
                }}
              />

              {showClienteOptions && (
                <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredClientes.length > 0 ? (
                    filteredClientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => selectCliente(cliente)}
                      >
                        {cliente.label}
                      </button>
                    ))
                  ) : isSearchingOtrosClientes ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      Buscando en clientes de otros socios comerciales...
                    </div>
                  ) : otrosClientesResultados.length > 0 ? (
                    <>
                      <div className="px-4 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Clientes de otros socios comerciales
                      </div>

                      {otrosClientesResultados.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => selectCliente(cliente)}
                        >
                          {cliente.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.clienteId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.clienteId.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Niveles de socios comerciales
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('nivelesRedComercial', {
                onChange: (event) => {
                  const value = Number(event.target.value);

                  if (value < 3) {
                    setValue('socioComercialNivel3Id', undefined, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setValue('porcentajeComisionSocioNivel3', undefined, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }

                  if (value < 2) {
                    setValue('socioComercialNivel2Id', undefined, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setValue('porcentajeComisionSocioNivel2', undefined, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                },
              })}
            >
              <option value="1">1 nivel</option>
              <option value="2">2 niveles</option>
              <option value="3">3 niveles</option>
            </select>

            {errors.nivelesRedComercial ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.nivelesRedComercial.message}
              </p>
            ) : null}
          </div>

          {canEditCommission && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Porcentaje de comisión para oficina
                </label>

                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('porcentajeComisionOficina')}
                />

                {errors.porcentajeComisionOficina ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.porcentajeComisionOficina.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Porcentaje de comisión socio comercial nivel 1
                </label>

                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('porcentajeComisionSocio')}
                />

                {errors.porcentajeComisionSocio ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.porcentajeComisionSocio.message}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Comisión total estimada:{' '}
                <span className="font-semibold text-slate-900">
                  {comisionPreview.total.toFixed(2)}%
                </span>{' '}
                (${formatCurrencyDisplay(comisionPreview.monto)})
              </div>
            </>
          )}

          {esAdmin && (
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">
                Socio comercial nivel 1
              </p>

              <p className="text-sm text-slate-600">
                {esSocioComercialNivel1DeLaOperacion ? 'Eres tu ' + operation.socioComercialNombre : operation.socioComercialNombre}
              </p>

              {/*  {esSocioComercialNivel1DeLaOperacion? nivelesRedComercialCliente && nivelesRedComercialCliente >= 2 ? (
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  Tú eres el socio comercial nivel 1 de esta operación y puedes modificar
                  los socios comerciales de nivel 2 y 3.
                </p>
              ): null : (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  No eres el socio comercial nivel 1 de esta operación. La red comercial
                  se muestra únicamente para consulta.
                </p>
              )} */}
            </div>
          )}

          {nivelesRedComercial >= 2 && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Socio comercial nivel 2
                </label>

                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  {...register('socioComercialNivel2Id')}
                >
                  <option value="">
                    Selecciona un socio comercial
                  </option>

                  {sociosNivel2Disponibles.map((partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.nombre}
                    </option>
                  ))}
                </select>

                {canEditCommission && (
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Porcentaje de comisión socio comercial nivel 2
                    </label>

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register('porcentajeComisionSocioNivel2')}
                    />

                    {errors.porcentajeComisionSocioNivel2 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.porcentajeComisionSocioNivel2.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          {nivelesRedComercial >= 3 && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Socio comercial nivel 3
                </label>

                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  {...register('socioComercialNivel3Id')}
                >
                  <option value="">
                    Selecciona un socio comercial
                  </option>

                  {sociosNivel3Disponibles.map((partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.nombre}
                    </option>
                  ))}
                </select>

                {canEditCommission && (
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Porcentaje de comisión socio comercial nivel 3
                    </label>

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register('porcentajeComisionSocioNivel3')}
                    />

                    {errors.porcentajeComisionSocioNivel3 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.porcentajeComisionSocioNivel3.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
              onChange={(event) => handleCurrencyChange(event.target.value)}
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

      <div className="sticky bottom-0 z-30 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur">
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full justify-center"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}