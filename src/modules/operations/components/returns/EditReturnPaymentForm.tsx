// EditReturnPaymentForm.tsx

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { formatCurrencyDisplay, normalizeCurrencyInput, onlyNumbers, parseCurrency, ReturnPaymentType } from '@/shared/utils/form.utils.js';
import { MEXICAN_BANKS } from '@/modules/bank-accounts/components/BankAccountFormModal.js';


export interface EditReturnPaymentFormValues {
    id: number;
    monto: number;
    tipoPago: ReturnPaymentType;
    banco?: string;
    titular?: string;
    cuenta?: string;
    clabe?: string;
    observaciones?: string;
}

interface EditReturnPaymentFormProps {
    payment: ReturnPaymentResponse;
    isSubmitting: boolean;
    onSubmit: (
        values: EditReturnPaymentFormValues,
    ) => Promise<void>;
}

interface FormState {
    monto: string;
    tipoPago: '' | ReturnPaymentType;
    banco: string;
    titular: string;
    cuenta: string;
    clabe: string;
    observaciones: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function mapPaymentToForm(
    payment: ReturnPaymentResponse,
): FormState {
    return {
        monto: formatCurrencyDisplay(payment.monto),
        tipoPago: payment.tipoPago as ReturnPaymentType,
        banco: payment.cuentaDestinoBanco ?? '',
        titular: payment.cuentaDestinoTitular ?? '',
        cuenta: payment.cuentaDestinoCliente ?? '',
        clabe: payment.cuentaClabeCliente ?? '',
        observaciones: payment.observaciones ?? '',
    };
}

export function EditReturnPaymentForm({
    payment,
    isSubmitting,
    onSubmit,
}: EditReturnPaymentFormProps) {
    const [form, setForm] = useState<FormState>(
        () => mapPaymentToForm(payment),
    );

    const [errors, setErrors] =
        useState<FormErrors>({});
    const [showBankOptions, setShowBankOptions] = useState(false);

    const filteredBanks = useMemo(() => {
        const search = form.banco.trim().toLowerCase();

        if (!search) {
            return MEXICAN_BANKS;
        }

        return MEXICAN_BANKS.filter((bank) =>
            bank.toLowerCase().includes(search),
        );
    }, [form.banco]);

    useEffect(() => {
        setForm(mapPaymentToForm(payment));
        setErrors({});
    }, [payment]);

    function updateField(
        field: keyof FormState,
        value: string,
    ) {
        let formattedValue = value;

        if (field === 'monto') {
            formattedValue =
                normalizeCurrencyInput(value);
        }

        if (field === 'cuenta') {
            formattedValue = onlyNumbers(value).slice(0, 12);
        }

        if (field === 'clabe') {
            formattedValue = onlyNumbers(value).slice(0, 18);
        }

        setForm((current) => ({
            ...current,
            [field]: formattedValue,
        }));

        setErrors((current) => ({
            ...current,
            [field]: undefined,
        }));
    }

    function validate() {
        const newErrors: FormErrors = {};

        const monto = parseCurrency(
            form.monto,
        );

        if (monto <= 0) {
            newErrors.monto =
                'El monto debe ser mayor a cero';
        }

        if (!form.tipoPago) {
            newErrors.tipoPago =
                'El tipo de retorno es obligatorio';
        }

        const requiereDatosBancarios =
            form.tipoPago === 'TRANSFERENCIA' ||
            form.tipoPago === 'DEPOSITO';

        if (requiereDatosBancarios) {
            if (!form.banco.trim()) {
                newErrors.banco = 'El banco destino es obligatorio';
            }

            if (!form.titular.trim()) {
                newErrors.titular = 'El titular es obligatorio';
            }

            const cuenta = form.cuenta.trim();
            const clabe = form.clabe.trim();

            if (!cuenta) {
                newErrors.cuenta = 'El número de cuenta es obligatorio';
            } else if (!/^\d{10,12}$/.test(cuenta)) {
                newErrors.cuenta = 'La cuenta debe tener entre 10 y 12 dígitos';
            }

            if (!clabe) {
                newErrors.clabe = 'La CLABE interbancaria es obligatoria';
            } else if (!/^\d{18}$/.test(clabe)) {
                newErrors.clabe = 'La CLABE debe tener exactamente 18 dígitos';
            }
        }

        setErrors(newErrors);

        return (
            Object.keys(newErrors).length === 0
        );
    }

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>,
    ) {
        e.preventDefault();

        if (!validate()) return;

        await onSubmit({
            id: payment.id,
            monto: parseCurrency(form.monto),
            tipoPago: form.tipoPago as ReturnPaymentType,
            banco: form.banco.trim(),
            titular: form.titular.trim(),
            cuenta: form.cuenta.trim(),
            clabe: form.clabe.trim(),
            observaciones: form.observaciones.trim(),
        });
    }

    const requiereDatosBancarios =
        form.tipoPago === 'TRANSFERENCIA' ||
        form.tipoPago === 'DEPOSITO';

    return (
        <form
            className="space-y-6"
            onSubmit={handleSubmit}
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Monto a retornar
                    </label>

                    <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="1,000.00"
                        value={form.monto}
                        error={errors.monto}
                        onChange={(e) =>
                            updateField(
                                'monto',
                                e.target.value,
                            )
                        }
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Tipo de retorno
                    </label>

                    <select
                        value={form.tipoPago}
                        onChange={(e) =>
                            updateField(
                                'tipoPago',
                                e.target.value,
                            )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                    >
                        <option value="">
                            Selecciona un tipo
                        </option>
                        <option value="EFECTIVO">
                            Efectivo
                        </option>
                        <option value="TRANSFERENCIA">
                            Transferencia
                        </option>
                        <option value="DEPOSITO">
                            Depósito
                        </option>
                    </select>

                    {errors.tipoPago && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.tipoPago}
                        </p>
                    )}
                </div>

                {requiereDatosBancarios && (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Banco destino
                            </label>

                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Busca o selecciona un banco"
                                    value={form.banco}
                                    error={errors.banco}
                                    onFocus={() => setShowBankOptions(true)}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setShowBankOptions(false);
                                        }, 150);
                                    }}
                                    onChange={(event) => {
                                        updateField(
                                            'banco',
                                            event.target.value,
                                        );

                                        setShowBankOptions(true);
                                    }}
                                />

                                {showBankOptions && (
                                    <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                        {filteredBanks.length > 0 ? (
                                            filteredBanks.map((bank) => (
                                                <button
                                                    key={bank}
                                                    type="button"
                                                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                                    onClick={() => {
                                                        updateField(
                                                            'banco',
                                                            bank,
                                                        );

                                                        setShowBankOptions(false);
                                                    }}
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
                                placeholder="Nombre del titular"
                                value={form.titular}
                                error={errors.titular}
                                onChange={(event) =>
                                    updateField('titular', event.target.value)
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
                                maxLength={12}
                                value={form.cuenta}
                                error={errors.cuenta}
                                onChange={(event) =>
                                    updateField('cuenta', event.target.value)
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
                                inputMode="numeric"
                                maxLength={18}
                                value={form.clabe}
                                error={errors.clabe}
                                onChange={(event) =>
                                    updateField('clabe', event.target.value)
                                }
                            />
                        </div>
                    </>
                )}

                <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Observaciones
                    </label>

                    <textarea
                        rows={2}
                        placeholder="Opcional"
                        value={form.observaciones}
                        onChange={(event) =>
                            updateField(
                                'observaciones',
                                event.target.value,
                            )
                        }
                        className="
      w-full
      rounded-xl
      border
      border-slate-300
      bg-white
      px-3
      py-2
      text-sm
      outline-none
      focus:border-slate-900
    "
                    />
                </div>
            </div>

            <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full justify-center"
            >
                Actualizar solicitud
            </Button>
        </form>
    );
}