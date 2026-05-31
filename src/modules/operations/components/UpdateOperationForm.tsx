import { useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
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
  nivel: 2 | 3;
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
    },
    mode: 'onChange',
  });

  const { user } = useAuth();

  const [clienteSearch, setClienteSearch] = useState(
    operation.clienteNombre,
  );

  const [showClienteOptions, setShowClienteOptions] = useState(false);

  const [nivelesRedComercialCliente, setNivelesRedComercialCliente] =
    useState<number | null>(
      operation.nivelesRedComercial ?? null,
    );

  const filteredClientes = useMemo(() => {
    const search = clienteSearch.trim().toLowerCase();

    if (!search) return clientes;

    return clientes.filter((cliente) =>
      cliente.label.toLowerCase().includes(search),
    );
  }, [clientes, clienteSearch]);

  const sociosNivel2 = useMemo(
    () =>
      commercialPartners.filter(
        (partner) => partner.nivel === 2,
      ),
    [commercialPartners],
  );

  const sociosNivel3 = useMemo(
    () =>
      commercialPartners.filter(
        (partner) => partner.nivel === 3,
      ),
    [commercialPartners],
  );

  const faltaSocioNivel2 =
    nivelesRedComercialCliente !== null &&
    nivelesRedComercialCliente >= 2 &&
    sociosNivel2.length === 0;

  const faltaSocioNivel3 =
    nivelesRedComercialCliente !== null &&
    nivelesRedComercialCliente >= 3 &&
    sociosNivel3.length === 0;

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
                  {filteredClientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setClienteSearch(cliente.label);

                        setNivelesRedComercialCliente(
                          cliente.nivelesRedComercial ?? null,
                        );

                        setValue(
                          'clienteId',
                          cliente.id,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          },
                        );

                        setValue(
                          'socioComercialNivel2Id',
                          undefined,
                        );

                        setValue(
                          'socioComercialNivel3Id',
                          undefined,
                        );

                        setShowClienteOptions(false);
                      }}
                    >
                      {cliente.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {errors.clienteId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.clienteId.message}
              </p>
            )}
          </div>

          {nivelesRedComercialCliente !== null && (
            <div>
              <p className="text-sm text-slate-600">
                Este cliente tiene{' '}
                <span className="font-semibold text-slate-900">
                  {nivelesRedComercialCliente}
                </span>{' '}
                {nivelesRedComercialCliente === 1
                  ? 'nivel de socios comerciales'
                  : 'niveles de socios comerciales'}
                .
              </p>
            </div>
          )}

          {faltaSocioNivel2 && (
            <div className="md:col-span-2 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Este cliente requiere un socio comercial de nivel 2.
              </p>
            </div>
          )}

          {faltaSocioNivel3 && (
            <div className="md:col-span-2 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Este cliente requiere un socio comercial de nivel 3.
              </p>
            </div>
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

          {nivelesRedComercialCliente !== null &&
            nivelesRedComercialCliente >= 2 && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Socio comercial nivel 2
                </label>

                <select
                  disabled={!puedeEditarRedComercial}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  {...register('socioComercialNivel2Id')}
                >
                  <option value="">
                    Selecciona un socio comercial
                  </option>

                  {sociosNivel2.map((partner) => (
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

          {nivelesRedComercialCliente !== null &&
            nivelesRedComercialCliente >= 3 && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Socio comercial nivel 3
                </label>

                <select
                  disabled={!puedeEditarRedComercial}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  {...register('socioComercialNivel3Id')}
                >
                  <option value="">
                    Selecciona un socio comercial
                  </option>

                  {sociosNivel3.map((partner) => (
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
          disabled={
            faltaSocioNivel2 ||
            faltaSocioNivel3
          }
          className="w-full justify-center"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}