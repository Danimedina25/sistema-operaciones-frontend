import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Button } from '@/shared/components/ui/Button';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  bankAccountSchema,
  type BankAccountFormValues,
} from '@/modules/bank-accounts/schemas/bank-account.schema';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { BankCombobox } from '@/shared/components/ui/BankCombobox';

interface BankAccountFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: BankAccountResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BankAccountFormValues) => void | Promise<void>;
}



export function BankAccountFormModal({
  open,
  mode,
  initialData,
  isSubmitting,
  onClose,
  onSubmit,
}: BankAccountFormModalProps) {
  const formId = useId();
  const { submit, busy, submitError } = useFormSubmission(onSubmit, isSubmitting);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      banco: '',
      titular: '',
      numeroCuenta: '',
      clabe: '',
    },
  });


  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      reset({
        banco: initialData.banco,
        titular: initialData.titular,
        numeroCuenta: initialData.numeroCuenta,
        clabe: initialData.clabe,
      });
      return;
    }

    reset({
      banco: '',
      titular: '',
      numeroCuenta: '',
      clabe: '',
    });
  }, [open, mode, initialData, reset]);

  if (!open) {
    return null;
  }

  return <ActionDrawer open={open} title={mode === 'create' ? 'Nueva cuenta bancaria' : 'Editar cuenta bancaria'} busy={busy} onClose={onClose}
    footer={<div className="flex justify-end gap-3">
      <Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Cancelar</Button>
      <Button type="submit" form={formId} isLoading={busy}>{mode === 'create' ? 'Registrar cuenta' : 'Guardar cambios'}</Button>
    </div>}>
    <form id={formId} className="space-y-5" onSubmit={handleSubmit(submit)}>
      {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <fieldset disabled={busy} className="min-w-0">
          <div className="grid gap-4 md:grid-cols-2">
            <BankCombobox
              label="Banco"
              value={watch('banco') || ''}
              onChange={bank => setValue('banco', bank, { shouldDirty: true, shouldValidate: true })}
              fieldError={errors.banco?.message}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Titular
              </label>
              <input
                type="text"
                {...register('titular')}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                placeholder="Nombre del titular (Beneficiario)"
              />
              {errors.titular && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.titular.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Número de cuenta
              </label>
              <input
                type="text"
                {...register('numeroCuenta')}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                placeholder="Número de cuenta"
              />
              {errors.numeroCuenta && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.numeroCuenta.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                CLABE
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={18}
                {...register('clabe')}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                placeholder="18 dígitos"
              />
              {errors.clabe && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.clabe.message}
                </p>
              )}
            </div>
          </div>

      </fieldset>
    </form>
  </ActionDrawer>;
}
