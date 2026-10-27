import { useId } from 'react';
import { ActionDrawerFooter } from '@/shared/components/ui/ActionDrawer';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
// src/modules/socioscomerciales/components/CommercialPartnerForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { BankCombobox } from '@/shared/components/ui/BankCombobox';
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
  onCancel?: () => void;
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
  onCancel,
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

  const formId = useId();
  const { submit, busy, submitError } = useFormSubmission(onSubmit, isSubmitting);

  return (
    <form id={formId}
      className="space-y-6"
      onSubmit={handleSubmit(submit)}
    >
      {submitError && <p role="alert" className="sticky top-0 z-10 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-5">

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

          <BankCombobox
            label="Banco"
            value={watch('banco') || ''}
            onChange={bank => setValue('banco', bank, { shouldDirty: true, shouldValidate: true })}
            fieldError={errors.banco?.message}
          />

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

      </fieldset>
      <ActionDrawerFooter>
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && <Button type="button" variant="neutral" disabled={busy} onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary"
          type="submit" form={formId}
          isLoading={busy}
        >
          {submitLabel}
        </Button>
      </div>
      </ActionDrawerFooter>
    </form>
  );
}
