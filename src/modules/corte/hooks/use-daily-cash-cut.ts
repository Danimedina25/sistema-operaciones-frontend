// src/modules/corte/hooks/useDailyCashCut.ts

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    calculateDailyCashCut,
    calculateCashCutRange,
    registerDailyCashCut,
    registerDailyCashCutByDate,
    calculateBankBalancesGrouped,
} from '@/modules/corte/api/corte.api';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type {
    BankGroupBalanceResponse,
    CashCutRangeResponse,
    DailyCashCutRequest,
    DailyCashCutResponse,
} from '@/modules/corte/types/corte.types';

interface UseDailyCashCutOptions {
    onSuccess?: () => void | Promise<void>;
}

export function useDailyCashCut(options?: UseDailyCashCutOptions) {
    const [isLoadingDailyCut, setIsLoadingDailyCut] = useState(false);
    const [isLoadingRangeCut, setIsLoadingRangeCut] = useState(false);
    const [isRegisteringCut, setIsRegisteringCut] = useState(false);

    const [dailyCut, setDailyCut] = useState<DailyCashCutResponse | null>(null);
    const [rangeCut, setRangeCut] = useState<CashCutRangeResponse | null>(null);

    const [isLoadingBankBalances, setIsLoadingBankBalances] = useState(false);

    const [bankBalancesGrouped, setBankBalancesGrouped] =
        useState<BankGroupBalanceResponse[]>([]);

    const fetchDailyCut = async (fecha: string) => {
        try {
            setIsLoadingDailyCut(true);

            const response = await calculateDailyCashCut(fecha);

            setDailyCut(response);

            return response;
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        } finally {
            setIsLoadingDailyCut(false);
        }
    };

    const fetchRangeCut = async (startDate: string, endDate: string) => {
        try {
            setIsLoadingRangeCut(true);

            const response = await calculateCashCutRange({
                startDate,
                endDate,
            });

            setRangeCut(response);

            return response;
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        } finally {
            setIsLoadingRangeCut(false);
        }
    };

    const submitRegisterDailyCutByDate = async (fecha: string) => {
        try {
            setIsRegisteringCut(true);

            const response = await registerDailyCashCutByDate(fecha);

            setDailyCut(response);

            toast.success('Corte diario registrado correctamente');
            await options?.onSuccess?.();

            return response;
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        } finally {
            setIsRegisteringCut(false);
        }
    };

    const submitRegisterDailyCut = async (payload: DailyCashCutRequest) => {
        try {
            setIsRegisteringCut(true);

            const response = await registerDailyCashCut(payload);

            setDailyCut(response);

            toast.success('Corte diario registrado correctamente');
            await options?.onSuccess?.();

            return response;
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        } finally {
            setIsRegisteringCut(false);
        }
    };

    const fetchBankBalancesGrouped = async (fecha?: string) => {
        try {
            setIsLoadingBankBalances(true);

            const response = await calculateBankBalancesGrouped(fecha);

            setBankBalancesGrouped(response);

            return response;
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        } finally {
            setIsLoadingBankBalances(false);
        }
    };

    return {
        dailyCut,
        rangeCut,

        isLoadingDailyCut,
        isLoadingRangeCut,
        isRegisteringCut,

        fetchDailyCut,
        fetchRangeCut,
        submitRegisterDailyCutByDate,
        submitRegisterDailyCut,

        bankBalancesGrouped,
        isLoadingBankBalances,
        fetchBankBalancesGrouped,
    };
}