import { useEffect, useState } from 'react';
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
    comprobante: FileList;
    observaciones?: string;
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

export function RealizeReturnPaymentForm({
    returnPayment,
    bankAccounts,
    isSubmitting,
    onSubmit,
}: RealizeReturnPaymentFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RealizeReturnPaymentFormValues>({
        defaultValues: {
            cuentaOrigenId: '',
            comprobante: undefined,
            observaciones: '',
        },
        mode: 'onChange',
    });

    const [isDragging, setIsDragging] = useState(false);
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
        null,
    );

    const comprobante = useWatch({
        control,
        name: 'comprobante',
    });

    const selectedFile =
        comprobante instanceof FileList && comprobante.length > 0
            ? comprobante[0]
            : null;

    const selectedReceiptIsImage = isImageFile(selectedFile);

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

    const requiereCuentaOrigen =
        returnPayment.tipoPago === 'TRANSFERENCIA' ||
        returnPayment.tipoPago === 'DEPOSITO';

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
                    <span className="block text-slate-500">Método solicitado</span>
                    <span className="font-semibold text-slate-900">
                        {paymentTypeLabels[returnPayment.tipoPago]}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Cuenta destino</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoCliente ?? '-'}
                    </span>
                </div>

                 <div>
                    <span className="block text-slate-500">Banco</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoBanco ?? '-'}
                    </span>
                </div>

                <div>
                    <span className="block text-slate-500">Titular</span>
                    <span className="font-semibold text-slate-900">
                        {returnPayment.cuentaDestinoTitular ?? '-'}
                    </span>
                </div>
            </div>

            {requiereCuentaOrigen ? (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Cuenta origen
                    </label>

                    <select
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
                        {...register('cuentaOrigenId', {
                            validate: (value) => {
                                if (!requiereCuentaOrigen) return true;

                                return Number(value) > 0 || 'La cuenta origen es obligatoria';
                            },
                        })}
                    >
                        <option value="">Selecciona una cuenta</option>

                        {bankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.label}
                            </option>
                        ))}
                    </select>

                    {errors.cuentaOrigenId ? (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.cuentaOrigenId.message}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Comprobante de pago
                </label>

                {selectedFile ? (
                    <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start gap-3">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                {selectedPreviewUrl ? (
                                    <img
                                        src={selectedPreviewUrl}
                                        alt="Comprobante seleccionado"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="px-2 text-center text-xs font-medium text-slate-500">
                                        Archivo seleccionado
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    Comprobante seleccionado
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-500">
                                    {selectedFile.name}
                                </p>

                                {selectedPreviewUrl ? (
                                    <a
                                        href={selectedPreviewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                                    >
                                        Ver imagen
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                <Controller
                    control={control}
                    name="comprobante"
                    rules={{
                        validate: (value) =>
                            value && value.length > 0
                                ? true
                                : 'El comprobante es obligatorio',
                    }}
                    render={({ field }) => (
                        <>
                            <label
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);

                                    const file = event.dataTransfer.files?.[0];
                                    if (!file) return;

                                    field.onChange(buildFileList(file));
                                }}
                                className={`flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${isDragging
                                    ? 'border-slate-900 bg-slate-50'
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(event) => {
                                        field.onChange(event.target.files ?? undefined);
                                    }}
                                />

                                <p className="text-sm font-medium text-slate-700">
                                    Arrastra y suelta el comprobante aquí
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    o haz clic para seleccionar un archivo
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    PDF, JPG, JPEG, PNG o WEBP
                                </p>
                            </label>

                            {selectedFile ? (
                                <p className="mt-2 text-xs text-slate-600">
                                    Archivo seleccionado:{' '}
                                    <span className="font-medium text-slate-900">
                                        {selectedFile.name}
                                    </span>
                                </p>
                            ) : null}
                        </>
                    )}
                />

                {errors.comprobante ? (
                    <p className="mt-1 text-xs text-red-600">
                        {errors.comprobante.message}
                    </p>
                ) : null}
            </div>

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
                Registrar
            </Button>
        </form>
    );
}