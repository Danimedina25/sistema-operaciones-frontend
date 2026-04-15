import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  bankAccountSchema,
  type BankAccountFormValues,
} from '@/modules/bank-accounts/schemas/bank-account.schema';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';

interface BankAccountFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: BankAccountResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BankAccountFormValues) => void | Promise<void>;
}

const MEXICAN_BANKS = [
  'BBVA México',
  'Banamex',
  'Santander México',
  'Banorte',
  'HSBC México',
  'Scotiabank',
  'Inbursa',
  'Banco Azteca',
  'Bancoppel',
  'BanBajío',
  'Afirme',
  'Banco Multiva',
  'Mifel',
  'Banregio',
  'Banco Base',
  'Actinver',
  'Banco Invex',
  'Bankaool',
  'Monex',
  'Intercam Banco',
  'Banco Ve por Más',
  'Banco del Bienestar',
  'Compartamos Banco',
  'Citibanamex',
  'NU México',
  'Hey Banco',
  'Bancrea',
  'Sabadell México',
];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bankContainerRef.current &&
        !bankContainerRef.current.contains(event.target as Node)
      ) {
        setShowBankOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div ref={bankContainerRef} className="relative">
              <label className="mb-1 block text-sm font-medium text-slate-700">
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

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
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