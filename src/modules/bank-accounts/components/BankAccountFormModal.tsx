import { useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'create'
              ? 'Nueva cuenta bancaria'
              : 'Editar cuenta bancaria'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Captura los datos de la cuenta bancaria.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          className="space-y-5 px-6 py-5"
        >
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

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Registrar cuenta'
                  : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}