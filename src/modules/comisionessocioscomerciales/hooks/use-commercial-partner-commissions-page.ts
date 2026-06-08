import { useEffect, useState } from 'react';

import {
  useCommissionSummary,
} from './use-commission-summary';

import {
  useOperationDetail,
} from './use-operation-detail';

import {
  usePayCommission,
} from './use-pay-commission';

import {
  useGenerateCommissions,
} from './use-generate-commissions';

import type {
  CommissionBeneficiaryResponse,
} from '../types/commercial-partner-commissions.types';

export interface CommissionFiltersValues {
  startDate: string;
  endDate: string;
}

function getDefaultDates() {
  const today = new Date();

  // 0=Dom, 1=Lun, ..., 6=Sáb
  const currentDay = today.getDay();

  const lastSaturday = new Date(today);

  lastSaturday.setDate(
    today.getDate() - currentDay - 1,
  );

  const lastSunday = new Date(lastSaturday);

  lastSunday.setDate(
    lastSaturday.getDate() - 6,
  );

  const formatDate = (
    date: Date,
  ) =>
    `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;

  return {
    startDate:
      formatDate(lastSunday),

    endDate:
      formatDate(lastSaturday),
  };
}
export function useCommercialPartnerCommissionsPage() {
  const defaultDates =
    getDefaultDates();

  const [filters, setFilters] =
    useState<CommissionFiltersValues>(
      defaultDates,
    );

  const [
    selectedBeneficiary,
    setSelectedBeneficiary,
  ] =
    useState<CommissionBeneficiaryResponse | null>(
      null,
    );

  const [
    isDetailModalOpen,
    setIsDetailModalOpen,
  ] = useState(false);

  const [
    isPayModalOpen,
    setIsPayModalOpen,
  ] = useState(false);

  const {
    summary,
    isLoading,
    fetchSummary,
  } =
    useCommissionSummary();

  const {
    detail,
    isLoading: isLoadingDetail,
    fetchOperationDetail,
  } =
    useOperationDetail();

  const {
    isLoading: isPaying,
    handlePayCommission,
  } =
    usePayCommission();

  const {
    isLoading: isGenerating,
    handleGenerateCommissions,
  } =
    useGenerateCommissions();

  useEffect(() => {
    void fetchSummary(
      defaultDates,
    );
  }, []);

  async function handleSearch(
    filtersToSearch = filters,
  ) {
    await fetchSummary(
      filtersToSearch,
    );
  }

  async function handleOpenOperationDetail(
    operationId: number,
  ) {
    await fetchOperationDetail(
      operationId,
    );

    setIsDetailModalOpen(true);
  }

  async function handleGenerate() {
    await handleGenerateCommissions();

    await fetchSummary(
      filters,
    );
  }

  async function handleSubmitPayment(
    paymentProofFile: File,
  ) {
    if (!selectedBeneficiary) {
      return;
    }

    await handlePayCommission(
      selectedBeneficiary.commissionId,
      selectedBeneficiary.operationId,
      paymentProofFile,
    );

    setIsPayModalOpen(false);

    if (detail) {
      await fetchOperationDetail(
        detail.operationId,
      );
    }

    await fetchSummary(
      filters,
    );
  }

  return {
    filters,
    setFilters,

    summary,
    isLoading,

    detail,
    isLoadingDetail,

    selectedBeneficiary,
    setSelectedBeneficiary,

    isDetailModalOpen,
    setIsDetailModalOpen,

    isPayModalOpen,
    setIsPayModalOpen,

    isPaying,
    isGenerating,

    handleSearch,
    handleGenerate,
    handleSubmitPayment,
    handleOpenOperationDetail,

    defaultDates,
  };
}