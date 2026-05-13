import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import {
  updateOperationSchema,
  type UpdateOperationFormInput,
  type UpdateOperationFormValues,
} from '@/modules/operations/schemas/update-operation.schema';
import { PaymentOperationResponse } from '../types/operations.types.ts';

interface SelectOption {
  id: number;
  label: string;
}

interface UpdateOperationFormProps {
  operation: PaymentOperationResponse;
  isSubmitting: boolean;
  clientes: SelectOption[];
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
    },
    mode: 'onChange',
  });

  const handleCurrencyChange = (rawValue: string) => {
    setValue('montoTotal', normalizeCurrencyInput(rawValue), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

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

            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              {...register('clienteId')}
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.label}
                </option>
              ))}
            </select>

            {errors.clienteId ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.clienteId.message}
              </p>
            ) : null}
          </div>

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