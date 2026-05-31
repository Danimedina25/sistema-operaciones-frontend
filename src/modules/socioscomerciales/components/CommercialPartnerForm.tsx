// src/modules/socioscomerciales/components/CommercialPartnerForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
    nivel: 2 | 3;
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
      nivel: '' as unknown as number,
      activo: true,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        nombre: initialValues.nombre,
        cuentaBancaria: initialValues.cuentaBancaria,
        banco: initialValues.banco,
        titularCuenta: initialValues.titularCuenta,
        nivel: initialValues.nivel,
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
          {...register('nombre')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Cuenta bancaria
        </label>

        <input
          type="text"
          inputMode="numeric"
          maxLength={18}
          {...register('cuentaBancaria')}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          placeholder="CLABE interbancaria"
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
          {...register('banco')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Titular de la cuenta
        </label>

        <Input
          placeholder="Nombre del titular"
          error={errors.titularCuenta?.message}
          {...register('titularCuenta')}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nivel
        </label>

        <select
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          {...register('nivel')}
        >
          <option value="">Selecciona un nivel</option>
          <option value="2">Nivel 2</option>
          <option value="3">Nivel 3</option>
        </select>

        {errors.nivel && (
          <p className="mt-1 text-xs text-red-600">
            {errors.nivel.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}