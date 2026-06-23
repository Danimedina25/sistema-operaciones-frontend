// src/modules/socioscomerciales/components/CreateCommercialPartnerForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

import {
  createCommercialPartnerSchema,
  type CreateCommercialPartnerFormInput,
  type CreateCommercialPartnerFormValues,
} from '@/modules/socioscomerciales/schemas/create-commercial-partner.schema';
import { capitalizeOnChange, capitalizeWords } from '@/shared/utils/text.utils';
import { MEXICAN_BANKS } from '@/modules/bank-accounts/components/BankAccountFormModal';
import { useMemo, useRef, useState } from 'react';

interface CreateCommercialPartnerFormProps {
  isSubmitting: boolean;

  onSubmit: (
    values: CreateCommercialPartnerFormValues,
  ) => Promise<unknown>;
}

export function CreateCommercialPartnerForm({
  isSubmitting,
  onSubmit,
}: CreateCommercialPartnerFormProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<
    CreateCommercialPartnerFormInput,
    unknown,
    CreateCommercialPartnerFormValues
  >({
    resolver: zodResolver(createCommercialPartnerSchema),
    defaultValues: {
      nombre: '',
      cuentaBancaria: '',
      banco: '',
      titularCuenta: '',
      activo: true,
    },
    mode: 'onBlur',
  });

  const [showBankOptions, setShowBankOptions] = useState(false);
  const bankFieldValue = watch('banco') || '';
  const bankContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredBanks = useMemo(() => {
    const search = bankFieldValue.trim().toLowerCase();

    if (!search) {
      return MEXICAN_BANKS;
    }

    return MEXICAN_BANKS.filter((bank) =>
      bank.toLowerCase().includes(search)
    );
  }, [bankFieldValue]);

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
              onChange: capitalizeOnChange(setValue, 'nombre'),
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
              onChange={(e) => {
                setValue('banco', e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });

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
                      key={bank}
                      type="button"
                      onClick={() => {
                        setValue('banco', bank, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        setShowBankOptions(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      {bank}
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
          Crear socio comercial
        </Button>
      </div>
    </form>
  );
}

