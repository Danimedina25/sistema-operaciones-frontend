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
    mode: 'onChange',
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nombre
        </label>

        <Input
          placeholder="Nombre del socio comercial"
          error={errors.nombre?.message}
          {...register('nombre', {
            onChange: capitalizeOnChange(setValue, 'nombre'),
          })}
        />
      </div>

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

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Banco
        </label>

        <Input
          placeholder="Nombre del banco"
          error={errors.banco?.message}
          {...register('banco', {
            onChange: capitalizeOnChange(setValue, 'banco'),
          })}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Titular de la cuenta
        </label>

        <Input
          placeholder="Nombre del titular"
          error={errors.titularCuenta?.message}
          {...register('titularCuenta', {
            onChange: capitalizeOnChange(setValue, 'titularCuenta'),
          })}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Crear socio comercial
        </Button>
      </div>
    </form>
  );
}