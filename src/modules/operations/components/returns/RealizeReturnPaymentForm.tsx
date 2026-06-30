import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import { ReturnPaymentResponse } from '../../types/operations.types.ts';

interface SelectOption {
    id: number;
    label: string;
}

export interface RealizeReturnPaymentFormValues {
    cuentaOrigenId?: string;
    comprobante?: FileList;
    observaciones?: string;
    fechaRecoleccionEfectivo?: string;
    horaRecoleccionEfectivo?: string;
}

interface RealizeReturnPaymentFormProps {
    returnPayment: ReturnPaymentResponse;
    bankAccounts: SelectOption[];
    isSubmitting: boolean;
    onSubmit: (values: RealizeReturnPaymentFormValues) => Promise<void>;
}

function formatCurrencyDisplay(value: number) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function isImageFile(file?: File | null) {
    if (!file) return false;
    return file.type.startsWith('image/');
}

function splitDateTime(value?: string | null) {
    if (!value) {
        return {
            date: '',
            time: '',
        };
    }

    const [date, timeWithSeconds] = value.split('T');

    return {
        date: date ?? '',
        time: timeWithSeconds?.slice(0, 5) ?? '',
    };
}

export function RealizeReturnPaymentForm({
    returnPayment,
    bankAccounts,
    isSubmitting,
    onSubmit,
}: RealizeReturnPaymentFormProps) {
    const pickupDateTime = splitDateTime(
        returnPayment.fechaHoraRecoleccionEfectivo,
    );
    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<RealizeReturnPaymentFormValues>({
        defaultValues: {
            cuentaOrigenId: '',
            comprobante: undefined,
            observaciones: returnPayment.observaciones ?? '',
            fechaRecoleccionEfectivo: pickupDateTime.date,
            horaRecoleccionEfectivo: pickupDateTime.time,
        },
        mode: 'onChange',
    });

    const [isDragging, setIsDragging] = useState(false);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
        null,
    );
    const [accountSearch, setAccountSearch] = useState('');
    const [showAccountOptions, setShowAccountOptions] = useState(false);

    const cuentaOrigenId = useWatch({
        control,
        name: 'cuentaOrigenId',
    });

    const comprobante = useWatch({
        control,
        name: 'comprobante',
    });

    const selectedFile =
        comprobante?.length
            ? comprobante[0]
            : null;

    const selectedReceiptIsImage = isImageFile(selectedFile);


    useEffect(() => {
        if (!cuentaOrigenId) return;

        const account = bankAccounts.find(
            (item) => String(item.id) === String(cuentaOrigenId),
        );

        if (account) {
            setAccountSearch(account.label);
        }
    }, [cuentaOrigenId, bankAccounts]);

    const filteredAccounts = useMemo(() => {
        const search = accountSearch.trim().toLowerCase();

        if (!search) {
            return bankAccounts;
        }

        return bankAccounts.filter((account) =>
            account.label.toLowerCase().includes(search),
        );
    }, [bankAccounts, accountSearch]);

    useEffect(() => {
        if (!selectedFile || !selectedReceiptIsImage) {
            setSelectedPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setSelectedPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile, selectedReceiptIsImage]);

    function buildFileList(file: File): FileList {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        return dataTransfer.files;
    }

    const esRetornoEnEfectivo = returnPayment.tipoPago === 'EFECTIVO';

    const isEditingCashPickup =
        esRetornoEnEfectivo &&
        !!returnPayment.fechaHoraRecoleccionEfectivo;

    const requiereCuentaOrigen =
        returnPayment.tipoPago === 'TRANSFERENCIA' ||
        returnPayment.tipoPago === 'DEPOSITO';

    const requiereComprobante = !esRetornoEnEfectivo;

    const requiereFechaHoraRecoleccion = esRetornoEnEfectivo;
    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
                <div>
                    <span className="block text-slate-500">Monto a pagar</span>
                    <span className="font-semibold text-slate-900">
                        ${formatCurrencyDisplay(returnPayment.monto)}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Banco</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoBanco ?? '-'}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Cuenta destino</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoCliente ?? '-'}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Método solicitado</span>
                    <span className="font-semibold text-slate-900">
                        {paymentTypeLabels[returnPayment.tipoPago]}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Titular</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoTitular ?? '-'}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">CLABE Interbancaria</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaClabeCliente ?? '-'}
                    </span>
                </div>
            </div>

            {requiereCuentaOrigen ? (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Cuenta origen
                    </label>

                    <div className="relative">
                        <input
                            type="hidden"
                            {...register('cuentaOrigenId', {
                                validate: (value) => {
                                    if (!requiereCuentaOrigen) return true;

                                    return (
                                        Number(value) > 0 ||
                                        'La cuenta origen es obligatoria'
                                    );
                                },
                            })}
                        />

                        <input
                            type="text"
                            value={accountSearch}
                            placeholder="Buscar cuenta..."
                            onFocus={() => setShowAccountOptions(true)}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowAccountOptions(false);
                                }, 150);
                            }}
                            onChange={(event) => {
                                setAccountSearch(event.target.value);

                                setValue('cuentaOrigenId', '', {
                                    shouldDirty: true,
                                    shouldValidate: false,
                                });

                                setShowAccountOptions(true);
                            }}
                            className="
            w-full
            rounded-xl
            border
            border-slate-300
            px-3
            py-2
            text-sm
            outline-none
            transition
            focus:border-slate-900
        "
                        />

                        {showAccountOptions && (
                            <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                {filteredAccounts.length > 0 ? (
                                    filteredAccounts.map((account) => (
                                        <button
                                            key={account.id}
                                            type="button"
                                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                            onClick={() => {
                                                setAccountSearch(account.label);

                                                setValue(
                                                    'cuentaOrigenId',
                                                    String(account.id),
                                                    {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                        shouldTouch: true,
                                                    },
                                                );

                                                setShowAccountOptions(false);
                                            }}
                                        >
                                            {account.label}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500">
                                        No se encontraron cuentas
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {errors.cuentaOrigenId ? (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.cuentaOrigenId.message}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {requiereFechaHoraRecoleccion ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Fecha de recolección
                        </label>

                        <input
                            type="date"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                            {...register('fechaRecoleccionEfectivo', {
                                validate: (value) => {
                                    if (!requiereFechaHoraRecoleccion) return true;
                                    return value?.trim()
                                        ? true
                                        : 'La fecha de recolección es obligatoria';
                                },
                            })}
                        />

                        {errors.fechaRecoleccionEfectivo ? (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.fechaRecoleccionEfectivo.message}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Hora de recolección
                        </label>

                        <input
                            type="time"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                            {...register('horaRecoleccionEfectivo', {
                                validate: (value) => {
                                    if (!requiereFechaHoraRecoleccion) return true;
                                    return value?.trim()
                                        ? true
                                        : 'La hora de recolección es obligatoria';
                                },
                            })}
                        />

                        {errors.horaRecoleccionEfectivo ? (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.horaRecoleccionEfectivo.message}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {requiereComprobante ? (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Comprobante de pago
                    </label>

                    <Controller
                        control={control}
                        name="comprobante"
                        rules={{
                            validate: (value) => {
                                if (!requiereComprobante) return true;

                                return value && value.length > 0
                                    ? true
                                    : 'El comprobante es obligatorio';
                            },
                        }}
                        render={({ field }) => (
                            <>
                                {/* aquí dejas igual todo tu render actual */}
                            </>
                        )}
                    />

                    {errors.comprobante ? (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.comprobante.message}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Observaciones
                </label>

                <textarea
                    rows={3}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                    {...register('observaciones')}
                />
            </div>

            <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full justify-center"
            >
                {esRetornoEnEfectivo
                    ? isEditingCashPickup
                        ? 'Actualizar fecha y hora de recolección'
                        : 'Guardar fecha y hora de recolección'
                    : 'Registrar retorno'}
            </Button>
        </form>
    );
}