// src/modules/socioscomerciales/components/CommercialPartnerForm.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { MEXICAN_BANKS } from '@/modules/bank-accounts/components/BankAccountFormModal';
import { capitalizeOnChange } from '@/shared/utils/text.utils';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

import {
  updateCommercialPartnerSchema,
  type UpdateCommercialPartnerFormInput,
  type UpdateCommercialPartnerFormValues,
} from '@/modules/socioscomerciales/schemas/update-commercial-partner.schema';

interface CommercialPartnerFormProps {
  isSubmitting: boolean;
  submitLabel: string;

  onSubmit: (
    values: UpdateCommercialPartnerFormValues,
  ) => Promise<unknown>;

  initialValues?: {
    nombre: string;
    cuentaBancaria: string;
    banco: string;
    titularCuenta: string;
    activo?: boolean;
  };
}

export function CommercialPartnerForm({
  isSubmitting,
  submitLabel,
  onSubmit,
  initialValues,
}: CommercialPartnerFormProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    UpdateCommercialPartnerFormInput,
    unknown,
    UpdateCommercialPartnerFormValues
  >({
    resolver: zodResolver(updateCommercialPartnerSchema),
    defaultValues: {
      nombre: '',
      cuentaBancaria: '',
      banco: '',
      titularCuenta: '',
      activo: true,
    },
    mode: 'onChange',
  });
  const [showBankOptions, setShowBankOptions] = useState(false);

  const bankFieldValue = watch('banco') || '';

  const bankContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredBanks = useMemo(() => {
    const search = bankFieldValue.trim().toLowerCase();

    if (!search) {
      return MEXICAN_BANKS;
    }

    return MEXICAN_BANKS.filter((bank) => {
      return (
        bank.value.toLowerCase().includes(search) ||
        bank.label.toLowerCase().includes(search)
      );
    });
  }, [bankFieldValue]);

  useEffect(() => {
    if (initialValues) {
      reset({
        nombre: initialValues.nombre,
        cuentaBancaria: initialValues.cuentaBancaria,
        banco: initialValues.banco,
        titularCuenta: initialValues.titularCuenta,
        activo: initialValues.activo ?? true,
      });

      return;
    }

    reset({
      nombre: '',
      cuentaBancaria: '',
      banco: '',
      titularCuenta: '',
      activo: true,
    });
  }, [initialValues, reset]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Datos generales */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Información general
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Datos básicos del socio comercial.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nombre del socio comercial
          </label>

          <Input
            placeholder="Nombre completo"
            error={errors.nombre?.message}
            {...register('nombre', {
              onChange: capitalizeOnChange(
                setValue,
                'nombre',
              ),
            })}
          />
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Información bancaria
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Cuenta donde se depositarán las comisiones.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CLABE interbancaria
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={18}
              {...register('cuentaBancaria')}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              placeholder="18 dígitos"
            />

            {errors.cuentaBancaria && (
              <p className="mt-1 text-xs text-red-600">
                {errors.cuentaBancaria.message}
              </p>
            )}
          </div>

          <div
            ref={bankContainerRef}
            className="relative"
          >
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Banco
            </label>

            <input
              type="text"
              {...register('banco')}
              onFocus={() => setShowBankOptions(true)}
              onChange={(event) => {
                setValue(
                  'banco',
                  event.target.value,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );

                setShowBankOptions(true);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              placeholder="Busca o selecciona un banco"
              autoComplete="off"
            />

            {showBankOptions && (
              <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredBanks.length > 0 ? (
                  filteredBanks.map((bank) => (
                    <button
                      key={bank.value}
                      type="button"
                      onClick={() => {
                        setValue(
                          'banco',
                          bank.value,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        );

                        setShowBankOptions(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      {bank.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No se encontraron bancos
                  </div>
                )}
              </div>
            )}

            {errors.banco && (
              <p className="mt-1 text-xs text-red-600">
                {errors.banco.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Titular de la cuenta
            </label>

            <Input
              placeholder="Nombre del titular"
              error={errors.titularCuenta?.message}
              {...register('titularCuenta', {
                onChange: capitalizeOnChange(
                  setValue,
                  'titularCuenta',
                ),
              })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}