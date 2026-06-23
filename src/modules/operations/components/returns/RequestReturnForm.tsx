import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { ReturnPaymentType } from '@/shared/utils/form.utils.js';
import { MEXICAN_BANKS } from '@/modules/bank-accounts/components/BankAccountFormModal.js';


interface ReturnPaymentItem {
  id: string; // react key
  paymentId?: number; // id BD
  monto: string;
  tipoPago: '' | ReturnPaymentType;
  banco?: string;
  titular?: string;
  cuenta?: string;
  clabe?: string;
  observaciones?: string;
  autorizadoParaRecibirEfectivo1?: string;
  autorizadoParaRecibirEfectivo2?: string;
  autorizadoParaRecibirEfectivo3?: string;
}

export interface RequestReturnFormValues {
  operationId: number;
  pagos: Array<{
    id?: number; // <- nuevo
    monto: number;
    tipoPago: ReturnPaymentType;
    banco?: string;
    titular?: string;
    cuenta?: string;
    clabe?: string;
    observaciones?: string;
    autorizadoParaRecibirEfectivo1?: string;
    autorizadoParaRecibirEfectivo2?: string;
    autorizadoParaRecibirEfectivo3?: string;
  }>;
}

interface RequestReturnFormProps {
  operationId: number;
  clienteNombre: string;
  montoTotalRetornar: number;
  montoSolicitado: number;
  faltaPorSolicitar: number;
  initialPayments?: ReturnPaymentResponse[];
  isSubmitting: boolean;
  onSubmit: (values: RequestReturnFormValues) => Promise<void>;
}
type PaymentErrors = Record<
  string,
  Partial<Record<keyof ReturnPaymentItem, string>>
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

function mapPaymentToForm(
  payment: ReturnPaymentResponse,
): ReturnPaymentItem {
  return {
    id: crypto.randomUUID(),
    paymentId: payment.id,
    monto: formatCurrencyDisplay(payment.monto),
    tipoPago: payment.tipoPago as ReturnPaymentType,
    banco: payment.cuentaDestinoBanco ?? '',
    titular: payment.cuentaDestinoTitular ?? '',
    observaciones: payment.observaciones ?? '',
    cuenta: payment.cuentaDestinoCliente ?? '',
    clabe: payment.cuentaClabeCliente ?? '',
    autorizadoParaRecibirEfectivo1: payment.autorizadoParaRecibirEfectivo1 ?? '',
    autorizadoParaRecibirEfectivo2: payment.autorizadoParaRecibirEfectivo2 ?? '',
    autorizadoParaRecibirEfectivo3: payment.autorizadoParaRecibirEfectivo3 ?? '',

  };
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
    autorizadoParaRecibirEfectivo1: '',
    autorizadoParaRecibirEfectivo2: '',
    autorizadoParaRecibirEfectivo3: ''
  };
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

export function RequestReturnForm({
  operationId,
  clienteNombre,
  montoTotalRetornar,
  montoSolicitado,
  faltaPorSolicitar,
  isSubmitting,
  initialPayments,
  onSubmit,
}: RequestReturnFormProps) {
  const [pagos, setPagos] = useState<ReturnPaymentItem[]>(() => {
    if (initialPayments?.length) {
      return initialPayments.map(mapPaymentToForm);
    }

    return [createEmptyPayment()];
  });

  useEffect(() => {
    if (initialPayments?.length) {
      setPagos(initialPayments.map(mapPaymentToForm));
    } else {
      setPagos([createEmptyPayment()]);
    }

    setErrors({});
  }, [initialPayments]);

  const [errors, setErrors] = useState<PaymentErrors>({});
  const [showBankOptions, setShowBankOptions] = useState<
    Record<string, boolean>
  >({});

  function getFilteredBanks(searchValue?: string) {
    const search = searchValue?.trim().toLowerCase() ?? '';

    if (!search) {
      return MEXICAN_BANKS;
    }

    return MEXICAN_BANKS.filter((bank) =>
      bank.toLowerCase().includes(search),
    );
  }

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

        const cuenta = pago.cuenta?.trim() ?? '';
        const clabe = pago.clabe?.trim() ?? '';

        if (!cuenta) {
          pagoErrors.cuenta = 'El número de cuenta es obligatorio';
        } else if (!/^\d{10,12}$/.test(cuenta)) {
          pagoErrors.cuenta = 'La cuenta debe tener entre 10 y 12 dígitos';
        }

        if (!clabe) {
          pagoErrors.clabe = 'La CLABE interbancaria es obligatoria';
        } else if (!/^\d{18}$/.test(clabe)) {
          pagoErrors.clabe = 'La CLABE debe tener exactamente 18 dígitos';
        }
      }

      if (pago.tipoPago === 'EFECTIVO') {
        const autorizado1 = pago.autorizadoParaRecibirEfectivo1?.trim() ?? '';
        const autorizado2 = pago.autorizadoParaRecibirEfectivo2?.trim() ?? '';
        const autorizado3 = pago.autorizadoParaRecibirEfectivo3?.trim() ?? '';

        if (!autorizado1 && !autorizado2 && !autorizado3) {
          pagoErrors.autorizadoParaRecibirEfectivo1 =
            'Debes capturar al menos una persona autorizada para recibir efectivo';
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

  const montoInicial = useMemo(() => {
    return initialPayments?.reduce(
      (acc, p) => acc + p.monto,
      0,
    ) ?? 0;
  }, [initialPayments]);

  const montoDisponible = faltaPorSolicitar + montoInicial;

  const saldoPendiente = Math.max(
    montoDisponible - totalSolicitado,
    0,
  );

  const excedente = Math.max(
    totalSolicitado - montoDisponible,
    0,
  );

  const excedeMonto = totalSolicitado > montoDisponible;

  function updatePago(
    paymentId: string,
    field: keyof ReturnPaymentItem,
    value: string,
  ) {
    let formattedValue = value;

    if (field === 'tipoPago') {
      setPagos((current) =>
        current.map((pago) => {
          if (pago.id !== paymentId) return pago;
          const requiereDatosBancarios =
            value === 'TRANSFERENCIA' || value === 'DEPOSITO';

          return {
            ...pago,
            tipoPago: value as ReturnPaymentType,

            banco: requiereDatosBancarios ? pago.banco : '',
            titular: requiereDatosBancarios ? pago.titular : '',
            cuenta: requiereDatosBancarios ? pago.cuenta : '',
            clabe: requiereDatosBancarios ? pago.clabe : '',

            autorizadoParaRecibirEfectivo1:
              value === 'EFECTIVO'
                ? pago.autorizadoParaRecibirEfectivo1
                : '',
            autorizadoParaRecibirEfectivo2:
              value === 'EFECTIVO'
                ? pago.autorizadoParaRecibirEfectivo2
                : '',
            autorizadoParaRecibirEfectivo3:
              value === 'EFECTIVO'
                ? pago.autorizadoParaRecibirEfectivo3
                : '',
          };
        }),
      );

      setErrors((current) => {
        const paymentErrors = current[paymentId];
        if (!paymentErrors) return current;

        const updatedPaymentErrors = { ...paymentErrors };
        delete updatedPaymentErrors.tipoPago;

        return {
          ...current,
          [paymentId]: updatedPaymentErrors,
        };
      });

      return;
    }

    if (field === 'monto') {
      formattedValue = normalizeCurrencyInput(value);
    }

    if (field === 'cuenta') {
      formattedValue = onlyNumbers(value).slice(0, 12);
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
        id: pago.paymentId,
        monto: parseCurrency(pago.monto),
        tipoPago: pago.tipoPago as ReturnPaymentType,
        banco: pago.banco?.trim(),
        titular: pago.titular?.trim(),
        cuenta: pago.cuenta?.trim(),
        clabe: pago.clabe?.trim(),
        observaciones: pago.observaciones?.trim(),
        autorizadoParaRecibirEfectivo1:
          pago.autorizadoParaRecibirEfectivo1?.trim() || undefined,
        autorizadoParaRecibirEfectivo2:
          pago.autorizadoParaRecibirEfectivo2?.trim() || undefined,
        autorizadoParaRecibirEfectivo3:
          pago.autorizadoParaRecibirEfectivo3?.trim() || undefined,
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
            ${formatCurrencyDisplay(montoSolicitado)}
          </span>
        </div>

        <div>
          <span className="block text-slate-500">Falta por solicitar</span>
          <span
            className={`font-semibold ${saldoPendiente === 0 ? 'text-emerald-700' : 'text-slate-900'
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
      {/* 
      {solicitudCompleta ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          El monto total a retornar ya está completamente distribuido.
        </div>
      ) : null} */}

      <div className="space-y-4">
        {pagos.map((pago, index) => {
          const requiereDatosBancarios =
            pago.tipoPago === 'TRANSFERENCIA' ||
            pago.tipoPago === 'DEPOSITO';

          const requiereAutorizadosEfectivo = pago.tipoPago === 'EFECTIVO';

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

                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Busca o selecciona un banco"
                          value={pago.banco}
                          error={errors[pago.id]?.banco}
                          onFocus={() =>
                            setShowBankOptions((prev) => ({
                              ...prev,
                              [pago.id]: true,
                            }))
                          }
                          onBlur={() => {
                            setTimeout(() => {
                              setShowBankOptions((prev) => ({
                                ...prev,
                                [pago.id]: false,
                              }));
                            }, 150);
                          }}
                          onChange={(event) => {
                            updatePago(
                              pago.id,
                              'banco',
                              event.target.value,
                            );

                            setShowBankOptions((prev) => ({
                              ...prev,
                              [pago.id]: true,
                            }));
                          }}
                        />

                        {showBankOptions[pago.id] && (
                          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                            {getFilteredBanks(pago.banco).length > 0 ? (
                              getFilteredBanks(pago.banco).map((bank) => (
                                <button
                                  key={bank}
                                  type="button"
                                  onClick={() => {
                                    updatePago(
                                      pago.id,
                                      'banco',
                                      bank,
                                    );

                                    setShowBankOptions((prev) => ({
                                      ...prev,
                                      [pago.id]: false,
                                    }));
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
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Titular de la cuenta
                      </label>

                      <Input
                        type="text"
                        placeholder="Nombre del beneficiario"
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
                        value={pago.cuenta}
                        inputMode="numeric"
                        maxLength={12}
                        error={errors[pago.id]?.cuenta}
                        onChange={(event) =>
                          updatePago(pago.id, 'cuenta', event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Cuenta CLABE interbancaria
                      </label>

                      <Input
                        type="text"
                        placeholder="CLABE interbancaria"
                        value={pago.clabe}
                        inputMode="numeric"
                        maxLength={18}
                        error={errors[pago.id]?.clabe}
                        onChange={(event) =>
                          updatePago(pago.id, 'clabe', event.target.value)
                        }
                      />
                    </div>
                  </>
                ) : null}

                {requiereAutorizadosEfectivo ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Autorizado para recibir efectivo 1
                      </label>

                      <Input
                        type="text"
                        placeholder="Nombre completo"
                        value={pago.autorizadoParaRecibirEfectivo1}
                        error={errors[pago.id]?.autorizadoParaRecibirEfectivo1}
                        onChange={(event) =>
                          updatePago(
                            pago.id,
                            'autorizadoParaRecibirEfectivo1',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Autorizado para recibir efectivo 2
                      </label>

                      <Input
                        type="text"
                        placeholder="Nombre completo"
                        value={pago.autorizadoParaRecibirEfectivo2}
                        onChange={(event) =>
                          updatePago(
                            pago.id,
                            'autorizadoParaRecibirEfectivo2',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Autorizado para recibir efectivo 3
                      </label>

                      <Input
                        type="text"
                        placeholder="Nombre completo"
                        value={pago.autorizadoParaRecibirEfectivo3}
                        onChange={(event) =>
                          updatePago(
                            pago.id,
                            'autorizadoParaRecibirEfectivo3',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="lg:col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-sm font-medium text-blue-800">
                        ** Las personas autorizadas para recibir el efectivo deberán presentar una identificación oficial vigente al momento del cobro.
                      </p>
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

      {
        (saldoPendiente <= 0) ? null :
          <button
            type="button"
            onClick={addPago}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar otro pago
          </button>
      }

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={excedeMonto || totalSolicitado <= 0}
        className="w-full justify-center"
      >
        {initialPayments?.length
          ? 'Actualizar solicitud'
          : 'Crear solicitud de retorno'}
      </Button>
    </form>
  );
}