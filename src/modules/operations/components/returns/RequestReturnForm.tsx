import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

type ReturnPaymentType = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';

interface ReturnPaymentItem {
  id: string;
  monto: string;
  tipoPago: '' | ReturnPaymentType;
  banco?: string;
  titular?: string;
  cuenta?: string;
  clabe?: string;
  observaciones?: string;
}

export interface RequestReturnFormValues {
  operationId: number;
  pagos: Array<{
    monto: number;
    tipoPago: ReturnPaymentType;
    banco?: string;
    titular?: string;
    cuenta?: string;
    clabe?: string;
    observaciones?: string;
  }>;
}

interface RequestReturnFormProps {
  operationId: number;
  clienteNombre: string;
  montoTotalRetornar: number;
  isSubmitting: boolean;
  onSubmit: (values: RequestReturnFormValues) => Promise<void>;
}
type PaymentErrors = Record<
  string,
  Partial<Record<keyof ReturnPaymentItem | 'cuentaOClabe', string>>
>;
function normalizeCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] ?? '';
  const decimalPart = parts[1] ?? '';

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';

  const formattedInteger = normalizedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );

  if (parts.length === 1) return formattedInteger;

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

function parseCurrency(value: string) {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrencyDisplay(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function createEmptyPayment(): ReturnPaymentItem {
  return {
    id: crypto.randomUUID(),
    monto: '',
    tipoPago: '',
    banco: '',
    titular: '',
    cuenta: '',
    clabe: '',
    observaciones: '',
  };
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

export function RequestReturnForm({
  operationId,
  clienteNombre,
  montoTotalRetornar,
  isSubmitting,
  onSubmit,
}: RequestReturnFormProps) {
  const [pagos, setPagos] = useState<ReturnPaymentItem[]>([
    createEmptyPayment(),
  ]);
  const [errors, setErrors] = useState<PaymentErrors>({});
  function validatePayments() {
  const newErrors: PaymentErrors = {};

  pagos.forEach((pago) => {
    const pagoErrors: PaymentErrors[string] = {};
    const monto = parseCurrency(pago.monto);

    if (monto <= 0) {
      pagoErrors.monto = 'El monto debe ser mayor a cero';
    }

    if (!pago.tipoPago) {
      pagoErrors.tipoPago = 'El tipo de retorno es obligatorio';
    }

    const requiereDatosBancarios =
      pago.tipoPago === 'TRANSFERENCIA' || pago.tipoPago === 'DEPOSITO';

    if (requiereDatosBancarios) {
      if (!pago.banco?.trim()) {
        pagoErrors.banco = 'El banco destino es obligatorio';
      }

      if (!pago.titular?.trim()) {
        pagoErrors.titular = 'El titular de la cuenta es obligatorio';
      }

      if (!pago.cuenta?.trim() && !pago.clabe?.trim()) {
        pagoErrors.cuentaOClabe =
          'Captura al menos número de cuenta o CLABE';
      }
    }
    
    if (pago.cuenta?.trim()) {
        if (pago.cuenta.length < 10) {
            pagoErrors.cuenta = 'La cuenta debe tener al menos 10 dígitos';
        }
    }

    if (pago.clabe?.trim()) {
        if (pago.clabe.length !== 18) {
            pagoErrors.clabe = 'La CLABE debe tener exactamente 18 dígitos';
        }
    }

    if (Object.keys(pagoErrors).length > 0) {
      newErrors[pago.id] = pagoErrors;
    }
  });

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
}

  const totalSolicitado = useMemo(() => {
    return pagos.reduce((total, pago) => {
      return total + parseCurrency(pago.monto);
    }, 0);
  }, [pagos]);

  const saldoPendiente = Math.max(montoTotalRetornar - totalSolicitado, 0);
  const excedente = Math.max(totalSolicitado - montoTotalRetornar, 0);

  const solicitudCompleta =
    totalSolicitado === montoTotalRetornar && montoTotalRetornar > 0;

  const excedeMonto = totalSolicitado > montoTotalRetornar;

 function updatePago(
  paymentId: string,
  field: keyof ReturnPaymentItem,
  value: string,
) {
  let formattedValue = value;

  if (field === 'monto') {
    formattedValue = normalizeCurrencyInput(value);
  }

  if (field === 'cuenta') {
    formattedValue = onlyNumbers(value).slice(0, 16);
  }

  if (field === 'clabe') {
    formattedValue = onlyNumbers(value).slice(0, 18);
  }

  setPagos((current) =>
    current.map((pago) =>
      pago.id === paymentId
        ? {
            ...pago,
            [field]: formattedValue,
          }
        : pago,
    ),
  );

  setErrors((current) => {
    const paymentErrors = current[paymentId];

    if (!paymentErrors) return current;

    const updatedPaymentErrors = { ...paymentErrors };

    delete updatedPaymentErrors[field];

    if (field === 'cuenta' || field === 'clabe') {
      delete updatedPaymentErrors.cuentaOClabe;
    }

    return {
      ...current,
      [paymentId]: updatedPaymentErrors,
    };
  });
}

  function addPago() {
    if (saldoPendiente <= 0) return;

    setPagos((current) => [
      ...current,
      {
        ...createEmptyPayment(),
        monto: formatCurrencyDisplay(saldoPendiente),
      },
    ]);
  }

  function removePago(paymentId: string) {
    setPagos((current) => {
      if (current.length === 1) return current;
      return current.filter((pago) => pago.id !== paymentId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (excedeMonto) return;

    const isValid = validatePayments();

    if (!isValid) return;

    await onSubmit({
        operationId,
        pagos: pagos.map((pago) => ({
        monto: parseCurrency(pago.monto),
        tipoPago: pago.tipoPago as ReturnPaymentType,
        banco: pago.banco?.trim(),
        titular: pago.titular?.trim(),
        cuenta: pago.cuenta?.trim(),
        clabe: pago.clabe?.trim(),
        observaciones: pago.observaciones?.trim(),
        })),
    });
    }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4">
        <div>
          <span className="block text-slate-500">Cliente</span>
          <span className="font-semibold text-slate-900">
            {clienteNombre}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Monto total a retornar</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(montoTotalRetornar)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Monto solicitado</span>
          <span className="font-semibold text-slate-900">
            ${formatCurrencyDisplay(totalSolicitado)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Falta por solicitar</span>
          <span
            className={`font-semibold ${
              saldoPendiente === 0 ? 'text-emerald-700' : 'text-slate-900'
            }`}
          >
            ${formatCurrencyDisplay(saldoPendiente)}
          </span>
        </div>
      </div>

      {excedeMonto ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          La solicitud excede el monto a retornar por $
          {formatCurrencyDisplay(excedente)}.
        </div>
      ) : null}

      {solicitudCompleta ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          El monto total a retornar ya está completamente distribuido.
        </div>
      ) : null}

      <div className="space-y-4">
        {pagos.map((pago, index) => {
          const requiereDatosBancarios =
            pago.tipoPago === 'TRANSFERENCIA' || pago.tipoPago === 'DEPOSITO';

          return (
            <div
              key={pago.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Pago #{index + 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define cómo se debe entregar este monto al cliente.
                  </p>
                </div>

                {pagos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removePago(pago.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Monto a retornar
                  </label>

                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="1,000.00"
                    error={errors[pago.id]?.monto}
                    value={pago.monto}
                    onChange={(event) =>
                      updatePago(pago.id, 'monto', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tipo de retorno
                  </label>

                  <select
                    value={pago.tipoPago}
                    onChange={(event) =>
                      updatePago(pago.id, 'tipoPago', event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="DEPOSITO">Depósito</option>
                  </select>

                  {errors[pago.id]?.tipoPago ? (
                    <p className="mt-1 text-xs text-red-600">
                        {errors[pago.id]?.tipoPago}
                    </p>
                    ) : null}
                </div>

                {requiereDatosBancarios ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Banco destino
                      </label>

                      <Input
                        type="text"
                        placeholder="Ej. BBVA, Banorte, Santander"
                        value={pago.banco}
                        error={errors[pago.id]?.banco}
                        onChange={(event) =>
                          updatePago(pago.id, 'banco', event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Titular de la cuenta
                      </label>

                      <Input
                        type="text"
                        placeholder="Nombre del titular"
                        value={pago.titular}
                        error={errors[pago.id]?.titular}
                        onChange={(event) =>
                          updatePago(pago.id, 'titular', event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Número de cuenta
                      </label>

                      <Input
                        type="text"
                        placeholder="Número de cuenta"
                        inputMode="numeric"
                        maxLength={16}
                        value={pago.cuenta}
                         error={
                            errors[pago.id]?.cuenta ||
                            errors[pago.id]?.cuentaOClabe
                        }
                        onChange={(event) =>
                          updatePago(pago.id, 'cuenta', event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        CLABE
                      </label>

                      <Input
                        type="text"
                        placeholder="CLABE interbancaria"
                        value={pago.clabe}
                        inputMode="numeric"
                        maxLength={18}
                        error={
                            errors[pago.id]?.clabe ||
                            errors[pago.id]?.cuentaOClabe
                        }
                        onChange={(event) =>
                          updatePago(pago.id, 'clabe', event.target.value)
                        }
                      />
                    </div>
                  </>
                ) : null}

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Observaciones
                  </label>

                  <textarea
                    rows={2}
                    placeholder="Opcional"
                    value={pago.observaciones}
                    onChange={(event) =>
                      updatePago(pago.id, 'observaciones', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addPago}
        disabled={saldoPendiente <= 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar otro pago
      </button>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={excedeMonto || totalSolicitado <= 0}
        className="w-full justify-center"
      >
        Crear solicitud de retorno
      </Button>
    </form>
  );
}