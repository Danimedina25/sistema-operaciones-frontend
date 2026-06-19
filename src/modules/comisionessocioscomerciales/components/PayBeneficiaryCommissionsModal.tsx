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
                    <>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                                Total a pagar
                            </p>

                            <p className="mt-2 text-3xl font-bold text-emerald-900">
                                {formatCurrency(
                                    beneficiary.totalPendientes,
                                )}
                            </p>

                            <p className="mt-1 text-sm text-emerald-700">
                                {beneficiary.totalComisionesPendientes} comisiones pendientes
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Información del beneficiario
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Verifica los datos bancarios antes de realizar el pago.
                                </p>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Beneficiario
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-900">
                                        {beneficiary.nombre}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Tipo
                                    </p>

                                    <p className="mt-1 text-slate-900">
                                        {beneficiary.beneficiaryType ===
                                            'COMMERCIAL_PARTNER'
                                            ? 'Socio comercial'
                                            : 'Usuario'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Banco
                                    </p>

                                    <p className="mt-1 text-slate-900">
                                        {beneficiary.banco ?? '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Titular
                                    </p>

                                    <p className="mt-1 text-slate-900">
                                        {beneficiary.titularCuenta ?? '-'}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Cuenta bancaria
                                    </p>

                                    <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
                                        {beneficiary.cuentaBancaria ?? '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Operaciones
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {beneficiary.totalOperaciones}
                                </p>
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                                    Comisiones pendientes
                                </p>

                                <p className="mt-2 text-2xl font-bold text-amber-900">
                                    {beneficiary.totalComisionesPendientes}
                                </p>
                            </div>

                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                                    Registros a pagar
                                </p>

                                <p className="mt-2 text-2xl font-bold text-blue-900">
                                    {beneficiary.commissionIdsToPay.length}
                                </p>
                            </div>
                        </div>
                    </>

                    <div>

                        <div className="mb-3">
                            <h3 className="text-base font-semibold text-slate-900">
                                Comprobante de pago
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Adjunta el comprobante que respalda el pago realizado al beneficiario.
                            </p>
                        </div>


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