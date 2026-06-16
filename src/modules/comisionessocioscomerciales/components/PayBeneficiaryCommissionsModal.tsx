import { useEffect, useState } from 'react';

import { Modal } from '@/shared/components/ui/Modal';

import type {
    CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';
import { formatPeriodDate } from '@/modules/operations/utils/operation-formatters';

interface PayBeneficiaryCommissionsModalProps {
    open: boolean;

    beneficiary: CommissionPartnerSummaryResponse | null;

    startDate: string;

    endDate: string;

    isSubmitting?: boolean;

    onClose: () => void;

    onSubmit: (
        paymentProofFile: File,
    ) => Promise<void>;
}

function formatCurrency(
    value: number,
) {
    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN',
        },
    ).format(value);
}


function isImageFile(
    file?: File | null,
) {
    if (!file) {
        return false;
    }

    return file.type.startsWith(
        'image/',
    );
}

export function PayBeneficiaryCommissionsModal({
    open,
    beneficiary,
    startDate,
    endDate,
    isSubmitting = false,
    onClose,
    onSubmit,
}: PayBeneficiaryCommissionsModalProps) {

    const [
        paymentProofFile,
        setPaymentProofFile,
    ] = useState<File | null>(
        null,
    );

    const [
        previewUrl,
        setPreviewUrl,
    ] = useState<string | null>(
        null,
    );

    const [
        isDragging,
        setIsDragging,
    ] = useState(false);

    useEffect(() => {

        if (
            !paymentProofFile ||
            !isImageFile(
                paymentProofFile,
            )
        ) {

            setPreviewUrl(
                null,
            );

            return;
        }

        const objectUrl =
            URL.createObjectURL(
                paymentProofFile,
            );

        setPreviewUrl(
            objectUrl,
        );

        return () =>
            URL.revokeObjectURL(
                objectUrl,
            );

    }, [paymentProofFile]);

    useEffect(() => {

        if (!open) {
            return;
        }

        setPaymentProofFile(
            null,
        );

        setPreviewUrl(
            null,
        );

    }, [open]);

    return (
        <Modal
            open={open}
            title={`Pagar comisiones · ${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}`}
            onClose={onClose}
        >

            {!beneficiary ? null : (

                <div className="space-y-5">

                    <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm">

                        <div>
                            <span className="font-medium">
                                Beneficiario:
                            </span>
                            {' '}
                            {beneficiary.nombre}
                        </div>

                        <div>
                            <span className="font-medium">
                                Tipo:
                            </span>
                            {' '}
                            {beneficiary.beneficiaryType ===
                                'COMMERCIAL_PARTNER'
                                ? 'Socio comercial'
                                : 'Usuario'}
                        </div>

                        <div>
                            <span className="font-medium">
                                Banco:
                            </span>
                            {' '}
                            {beneficiary.banco ?? '-'}
                        </div>

                        <div>
                            <span className="font-medium">
                                Cuenta:
                            </span>
                            {' '}
                            {beneficiary.cuentaBancaria ?? '-'}
                        </div>

                        <div>
                            <span className="font-medium">
                                Titular:
                            </span>
                            {' '}
                            {beneficiary.titularCuenta ?? '-'}
                        </div>

                        <div>
                            <span className="font-medium">
                                Operaciones:
                            </span>
                            {' '}
                            {beneficiary.totalOperaciones}
                        </div>

                        <div>
                            <span className="font-medium">
                                Comisiones pendientes:
                            </span>
                            {' '}
                            {beneficiary.totalComisionesPendientes}
                        </div>

                        <div>
                            <span className="font-medium">
                                Registros a pagar:
                            </span>
                            {' '}
                            {
                                beneficiary
                                    .commissionIdsToPay
                                    .length
                            }
                        </div>

                        <div>
                            <span className="font-medium">
                                Total pendiente:
                            </span>
                            {' '}
                            <span className="text-amber-700">
                                {formatCurrency(
                                    beneficiary.totalPendientes,
                                )}
                            </span>
                        </div>

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Comprobante de pago
                        </label>

                        {paymentProofFile && (

                            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">

                                <div className="flex items-start gap-3">

                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">

                                        {previewUrl ? (

                                            <img
                                                src={previewUrl}
                                                alt="Comprobante"
                                                className="h-full w-full object-cover"
                                            />

                                        ) : (

                                            <span className="px-2 text-center text-xs font-medium text-slate-500">
                                                Archivo seleccionado
                                            </span>

                                        )}

                                    </div>

                                    <div className="flex-1">

                                        <p className="text-sm font-semibold text-slate-800">
                                            Comprobante seleccionado
                                        </p>

                                        <p className="mt-1 truncate text-xs text-slate-500">
                                            {paymentProofFile.name}
                                        </p>

                                        {previewUrl && (

                                            <a
                                                href={previewUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                            >
                                                Ver imagen
                                            </a>

                                        )}

                                    </div>

                                </div>

                            </div>

                        )}

                        {paymentProofFile ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Comprobante"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="px-2 text-center text-xs text-slate-500">
                                                PDF
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Comprobante seleccionado
                                        </p>

                                        <p className="mt-1 break-all text-xs text-slate-500">
                                            {paymentProofFile.name}
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            {previewUrl && (
                                                <a
                                                    href={previewUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Ver imagen
                                                </a>
                                            )}

                                            <label className="inline-flex cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                                                Cambiar comprobante

                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                    className="hidden"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];

                                                        if (!file) return;

                                                        setPaymentProofFile(file);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
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

                                    setPaymentProofFile(file);
                                }}
                                className={`flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${isDragging
                                        ? 'border-slate-900 bg-slate-50'
                                        : 'border-slate-300 bg-white hover:border-slate-400'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];

                                        if (!file) return;

                                        setPaymentProofFile(file);
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
                        )}

                    </div>

                    <div className="flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={
                                !paymentProofFile ||
                                isSubmitting
                            }
                            onClick={() => {

                                if (
                                    !paymentProofFile
                                ) {
                                    return;
                                }

                                void onSubmit(
                                    paymentProofFile,
                                );
                            }}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Registrando...'
                                : 'Confirmar pago'}
                        </button>

                    </div>

                </div>

            )}

        </Modal>
    );
}