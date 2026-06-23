// components/ReturnPaymentDetailModal.tsx

import { Modal } from '@/shared/components/ui/Modal';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
    formatCurrency,
    formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { ReturnStatusBadge } from './ReturnStatusBadge.js';

interface Props {
    open: boolean;
    onClose: () => void;
    returnPayment: ReturnPaymentResponse | null;
}

export function ReturnPaymentDetailModal({
    open,
    onClose,
    returnPayment,
}: Props) {
    const autorizados = [
        returnPayment?.autorizadoParaRecibirEfectivo1,
        returnPayment?.autorizadoParaRecibirEfectivo2,
        returnPayment?.autorizadoParaRecibirEfectivo3,
    ].filter((value): value is string => !!value?.trim());

    const isCashReturn = returnPayment?.tipoPago === 'EFECTIVO';

    return (
        <Modal open={open} onClose={onClose} title="Detalle del retorno">
            {!returnPayment ? (
                <div className="py-10 text-center text-sm text-slate-500">
                    No se encontró información del retorno.
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Monto del retorno
                                </p>
                                <p className="mt-1 text-2xl font-bold text-slate-950">
                                    {formatCurrency(returnPayment.monto)}
                                </p>
                            </div>

                            <ReturnStatusBadge status={returnPayment.estatus} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <DetailItem
                            label="Tipo de retorno"
                            value={paymentTypeLabels[returnPayment.tipoPago]}
                        />

                        <DetailItem
                            label="Fecha solicitud"
                            value={
                                returnPayment.fechaSolicitud
                                    ? formatDate(returnPayment.fechaSolicitud)
                                    : '-'
                            }
                        />

                        <DetailItem
                            label="Pagado por"
                            value={returnPayment.pagadoPorNombre ?? '-'}
                        />

                        <DetailItem
                            label="Fecha retorno"
                            value={
                                returnPayment.fechaPago
                                    ? formatDate(returnPayment.fechaPago)
                                    : '-'
                            }
                        />

                        {!isCashReturn ? (
                            <>
                                <DetailItem
                                    label="Banco destino"
                                    value={returnPayment.cuentaDestinoBanco ?? '-'}
                                />
                                <DetailItem
                                    label="Titular / beneficiario"
                                    value={returnPayment.cuentaDestinoTitular ?? '-'}
                                />
                                <DetailItem
                                    label="Cuenta"
                                    value={returnPayment.cuentaDestinoCliente ?? '-'}
                                />
                                <DetailItem
                                    label="CLABE"
                                    value={returnPayment.cuentaClabeCliente ?? '-'}
                                />
                            </>
                        ) : null}
                    </div>

                    {returnPayment.tipoPago === 'EFECTIVO' ? (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                            <p className="text-sm font-semibold text-blue-900">
                                Personas autorizadas para recibir efectivo
                            </p>

                            {autorizados.length > 0 ? (
                                <ul className="mt-3 space-y-2">
                                    {autorizados.map((autorizado, index) => (
                                        <li
                                            key={`${autorizado}-${index}`}
                                            className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                                        >
                                            {index + 1}. {autorizado}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 text-sm text-blue-700">
                                    No hay personas autorizadas registradas.
                                </p>
                            )}

                            <p className="mt-3 text-xs text-blue-700">
                                El efectivo únicamente podrá entregarse al titular o a una persona autorizada, previa identificación oficial vigente.
                            </p>
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Observaciones
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            {returnPayment.observaciones?.trim() || '-'}
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-slate-800">
                {value}
            </p>
        </div>
    );
}