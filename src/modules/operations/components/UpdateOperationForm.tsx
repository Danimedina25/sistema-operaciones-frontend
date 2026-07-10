import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
    },
    mode: 'onChange',
  });

  const { user } = useAuth();

  const [clienteSearch, setClienteSearch] = useState(
    operation.clienteNombre,
  );

  const [showClienteOptions, setShowClienteOptions] = useState(false);

  const nivelesRedComercialRaw = useWatch({
    control,
    name: 'nivelesRedComercial',
  });

  const nivelesRedComercial = Number(nivelesRedComercialRaw) || 1;

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

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                  }

                  if (value < 2) {
                    setValue('socioComercialNivel2Id', undefined, {
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