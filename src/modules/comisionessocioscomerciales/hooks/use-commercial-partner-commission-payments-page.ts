import {
  useEffect,
  useState,
} from 'react';

import {
  useBeneficiarySummary,
} from './use-beneficiary-summary';

import {
  usePayBeneficiaryCommissions,
} from './use-pay-beneficiary-commissions';

import type {
  CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';

export interface CommissionFiltersValues {
  startDate: string;
  endDate: string;
}

function getDefaultDates() {
  const today = new Date();

  // 0=Dom, 1=Lun, ..., 6=Sáb
  const currentDay = today.getDay();

  const lastSaturday =
    new Date(today);

  lastSaturday.setDate(
    today.getDate() -
      currentDay -
      1,
  );

  const lastSunday =
    new Date(lastSaturday);

  lastSunday.setDate(
    lastSaturday.getDate() -
      6,
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
      formatDate(
        lastSunday,
      ),

    endDate:
      formatDate(
        lastSaturday,
      ),
  };
}

export function useCommercialPartnerCommissionPaymentsPage() {

  const defaultDates =
    getDefaultDates();

  const [
    filters,
    setFilters,
  ] =
    useState<CommissionFiltersValues>(
      defaultDates,
    );

  const [
    selectedBeneficiary,
    setSelectedBeneficiary,
  ] =
    useState<CommissionPartnerSummaryResponse | null>(
      null,
    );

  const [
    isPayModalOpen,
    setIsPayModalOpen,
  ] =
    useState(false);

  const {
    summary,
    isLoading,
    fetchSummary,
  } =
    useBeneficiarySummary();

  const {
    isLoading: isPaying,
    handlePayBeneficiaryCommissions,
  } =
    usePayBeneficiaryCommissions();

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

  async function handleSubmitPayment(
    paymentProofFile: File,
  ) {

    if (
      !selectedBeneficiary
    ) {
      return;
    }

    await handlePayBeneficiaryCommissions(
      selectedBeneficiary.commissionIdsToPay,
      paymentProofFile,
    );

    setIsPayModalOpen(
      false,
    );

    await fetchSummary(
      filters,
    );
  }

  return {

    filters,
    setFilters,

    summary,
    isLoading,

    selectedBeneficiary,
    setSelectedBeneficiary,

    isPayModalOpen,
    setIsPayModalOpen,

    isPaying,

    handleSearch,
    handleSubmitPayment,

    defaultDates,

  };
}