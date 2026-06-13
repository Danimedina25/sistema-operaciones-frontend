import { useEffect, useState } from 'react';

import {
  CommissionFilters,
} from '../components/CommissionFilters';

import {
  CommissionSummaryCards,
} from '../components/CommissionSummaryCards';

import {
  CommissionSummaryCardsSkeleton,
} from '../components/CommissionSummaryCardsSkeleton';

import {
  CommissionOperationsTable,
} from '../components/CommissionOperationsTable';

import {
  CommissionOperationsTableSkeleton,
} from '../components/CommissionOperationsTableSkeleton';

import {
  CommissionOperationDetailModal,
} from '../components/CommissionOperationDetailModal';

import {
  PayCommissionModal,
} from '../components/PayCommissionModal';

import {
  EmptyCommissionsState,
} from '../components/EmptyCommissionsState';

import {
  CommissionFiltersValues,
  useCommercialPartnerCommissionsPage,
} from '../hooks/use-commercial-partner-commissions-page';

import type {
  CommissionPartnerSummaryResponse,
} from '../types/commercial-partner-commissions.types';

import {
  usePayBeneficiaryCommissions,
} from '../hooks/use-pay-beneficiary-commissions';

import {
  useAuth,
} from '@/modules/auth/store/auth.context';
import { useBeneficiarySummary } from '../hooks/use-beneficiary-summary';
import { CommissionBeneficiariesTable } from '../components/CommissionBeneficiariesTable';
import { PayBeneficiaryCommissionsModal } from '../components/PayBeneficiaryCommissionsModal';
import { useBeneficiaryCommissionDetail } from '../hooks/use-beneficiary-commission-detail';
import { BeneficiaryCommissionDetailModal } from '../components/BeneficiaryCommissionDetailModal';


export default function CommercialPartnerCommissionsPage() {
  const { hasRole } = useAuth();

  const canGenerate =
    hasRole([
      'ADMIN',
    ]);

  const {
    summary: beneficiarySummary,
    isLoading: isLoadingBeneficiaries,
    fetchSummary: fetchBeneficiarySummary,
  } = useBeneficiarySummary();

  const {
    isLoading: isPayingBeneficiary,
    handlePayBeneficiaryCommissions,
  } =
    usePayBeneficiaryCommissions();

  const {
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
  } =
    useCommercialPartnerCommissionsPage();

  const [
    selectedPartner,
    setSelectedPartner,
  ] =
    useState<CommissionPartnerSummaryResponse | null>(
      null,
    );

  const [
    isPayPartnerModalOpen,
    setIsPayPartnerModalOpen,
  ] = useState(false);

  const {
    detail: beneficiaryDetail,
    isLoading: isLoadingBeneficiaryDetail,
    fetchDetail,
    clearDetail,
  } =
    useBeneficiaryCommissionDetail();

  const [
    isBeneficiaryDetailModalOpen,
    setIsBeneficiaryDetailModalOpen,
  ] =
    useState(false);

  function handleOpenPayBeneficiaryModal(
    beneficiary: CommissionPartnerSummaryResponse,
  ) {

    setSelectedPartner(
      beneficiary,
    );

    setIsPayPartnerModalOpen(
      true,
    );
  }

  async function handleOpenBeneficiaryDetail(
    beneficiary: CommissionPartnerSummaryResponse,
  ) {

    setIsBeneficiaryDetailModalOpen(
      true,
    );

    await fetchDetail({
      beneficiaryId:
        beneficiary.beneficiaryId,

      beneficiaryType:
        beneficiary.beneficiaryType,

      startDate:
        filters.startDate,

      endDate:
        filters.endDate,
    });
  }


  const handleSearchWithDates = async (
    newFilters: CommissionFiltersValues,
  ) => {

    setFilters(
      newFilters,
    );

    await Promise.all([
      handleSearch(
        newFilters,
      ),
      fetchBeneficiarySummary(
        newFilters,
      ),
    ]);
  };


  return (
    <div className="space-y-3">
      {/* HEADER */}

      <div className="relative flex items-center rounded-2xl bg-white p-4 shadow-sm">
        {canGenerate && (
          <button
            type="button"
            disabled={
              isGenerating
            }
            onClick={
              handleGenerate
            }
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            Generar comisiones
          </button>
        )}

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Pago de
            Comisiones a socios
            comerciales
          </h1>

          <p className="text-xs text-slate-500">
            Consulta,
            administra y
            registra pagos de
            comisiones a socios
            comerciales.
          </p>
        </div>
      </div>

      {/* FILTROS */}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h2 className="text-md font-semibold text-slate-900">
            Semana de comisiones
          </h2>
        </div>

        <CommissionFilters
          filters={filters}
          onChange={setFilters}
          onSubmit={
            handleSearchWithDates
          }
          isLoading={
            isLoading
          }
        />
      </section>

      {/* RESUMEN */}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Resumen
              General
            </h2>
          </div>
        </div>


        {isLoading || !summary ? (

          <CommissionSummaryCardsSkeleton />

        ) : (

          <CommissionSummaryCards
            summary={summary}
          />

        )}

      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-lg font-semibold text-slate-900">
            Gestión de comisiones por socios comerciales
          </h2>

        </div>

        <div className="mb-5">

        </div>

        {isLoadingBeneficiaries ? (

          <CommissionOperationsTableSkeleton />

        ) : beneficiarySummary?.socios
          .length ? (

          <CommissionBeneficiariesTable
            beneficiaries={
              beneficiarySummary.socios
            }
            onPayBeneficiary={
              handleOpenPayBeneficiaryModal
            }
            onViewDetail={
              handleOpenBeneficiaryDetail
            }
          />

        ) : (

          <EmptyCommissionsState
            onResetFilters={() =>
              setFilters(
                defaultDates,
              )
            }
          />

        )}
      </section>

      {/* DETALLE */}

      <CommissionOperationDetailModal
        open={
          isDetailModalOpen
        }
        detail={detail}
        isLoading={
          isLoadingDetail
        }
        onClose={() =>
          setIsDetailModalOpen(
            false,
          )
        }
        onPayCommission={(
          beneficiary,
        ) => {
          setSelectedBeneficiary(
            beneficiary,
          );

          setIsPayModalOpen(
            true,
          );
        }}
      />

      {/* PAGO */}

      <PayCommissionModal
        open={
          isPayModalOpen
        }
        beneficiary={
          selectedBeneficiary
        }
        isSubmitting={
          isPaying
        }
        onClose={() =>
          setIsPayModalOpen(
            false,
          )
        }
        onSubmit={
          handleSubmitPayment
        }
      />

      <PayBeneficiaryCommissionsModal
        open={isPayPartnerModalOpen}
        beneficiary={selectedPartner}
        startDate={filters.startDate}
        endDate={filters.endDate}
        isSubmitting={isPayingBeneficiary}
        onClose={() =>
          setIsPayPartnerModalOpen(
            false,
          )
        }
        onSubmit={async (
          paymentProofFile,
        ) => {

          if (!selectedPartner) {
            return;
          }

          await handlePayBeneficiaryCommissions(
            selectedPartner.commissionIdsToPay,
            paymentProofFile,
          );

          setIsPayPartnerModalOpen(
            false,
          );

          await handleSearchWithDates(
            filters,
          );
        }}
      />

      <BeneficiaryCommissionDetailModal
        open={
          isBeneficiaryDetailModalOpen
        }
        detail={
          beneficiaryDetail
        }
        isLoading={
          isLoadingBeneficiaryDetail
        }
        onClose={() => {

          setIsBeneficiaryDetailModalOpen(
            false,
          );

          clearDetail();

        }}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />


    </div>
  );
}