import { useState } from 'react';
import toast from 'react-hot-toast';

import {
    payBeneficiaryCommissions,
} from '../api/commercial-partner-commissions.api';

import {
    uploadOperationProof,
} from '@/modules/operations/api/operations-storage.api';

import {
    useAuth,
} from '@/modules/auth/store/auth.context';

import {
    getApiErrorMessage,
} from '@/shared/utils/errors';

export function usePayBeneficiaryCommissions() {

    const [isLoading, setIsLoading] =
        useState(false);

    const { user } = useAuth();

    const handlePayBeneficiaryCommissions =
        async (
            commissionIds: number[],
            paymentProofFile: File,
        ) => {

            try {

                setIsLoading(true);

                if (!user?.userId) {
                    throw new Error(
                        'No se pudo identificar al usuario',
                    );
                }

                if (!commissionIds.length) {
                    throw new Error(
                        'No hay comisiones pendientes para pagar',
                    );
                }

                const uploadResult =
                    await uploadOperationProof({
                        file: paymentProofFile,
                        userId: user.userId,
                        operationId: 0,
                    });

                await payBeneficiaryCommissions({
                    commissionIds,
                    paymentProofUrl:
                        uploadResult.downloadUrl,
                });

                toast.success(
                    'Comisiones pagadas exitosamente',
                );

            } catch (error) {

                toast.error(
                    getApiErrorMessage(error),
                );

                throw error;

            } finally {

                setIsLoading(false);

            }
        };

    return {
        isLoading,
        handlePayBeneficiaryCommissions,
    };
}