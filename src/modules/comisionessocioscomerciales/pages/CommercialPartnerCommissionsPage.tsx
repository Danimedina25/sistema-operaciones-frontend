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
import { CommissionViewModeSelector } from '../components/CommissionViewModeSelector';
import { useBeneficiarySummary } from '../hooks/use-beneficiary-summary';
import { CommissionBeneficiariesTable } from '../components/CommissionBeneficiariesTable';
import { CommissionBeneficiarySummaryCards } from '../components/CommissionBeneficiarySummaryCards';

type ViewMode =
  | 'OPERATIONS'
  | 'BENEFICIARIES';

export default function CommercialPartnerCommissionsPage() {
  const { hasRole } = useAuth();

  const canGenerate =
    hasRole([
      'ADMIN',
      'GERENTE',
    ]);
  const [
    viewMode,
    setViewMode,
  ] = useState<
    'OPERATIONS'
    | 'BENEFICIARIES'
  >(
    'BENEFICIARIES',
  );

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



  const formatDate = (
    date: string,
  ) => {
    const [
      year,
      month,
      day,
    ] = date
      .split('-')
      .map(Number);

    const formatted =
      new Intl.DateTimeFormat(
        'es-MX',
        {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      ).format(
        new Date(
          year,
          month - 1,
          day,
        ),
      );

    return formatted
      .split(' ')
      .map(
        word =>
          word.charAt(0)
            .toUpperCase() +
          word.slice(1),
      )
      .join(' ');
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
          <h2 className="text-lg font-semibold text-slate-900">
            Filtros de búsqueda
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

        {viewMode === 'OPERATIONS' ? (

          isLoading || !summary ? (

            <CommissionSummaryCardsSkeleton />

          ) : (

            <CommissionSummaryCards
              summary={summary}
            />

          )

        ) : (

          isLoadingBeneficiaries ||
            !beneficiarySummary ? (

            <CommissionSummaryCardsSkeleton />

          ) : (

            <CommissionBeneficiarySummaryCards
              summary={beneficiarySummary}
            />

          )

        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-lg font-semibold text-slate-900">
            Gestión de comisiones
          </h2>

          <CommissionViewModeSelector
            value={viewMode}
            onChange={setViewMode}
          />

        </div>

        <div className="mb-5">

          <h3 className="text-base font-medium text-slate-700">

            {viewMode === 'OPERATIONS'
              ? 'Operaciones con comisiones'
              : 'Socios comerciales con comisiones'}

          </h3>

        </div>

        {viewMode === 'OPERATIONS' ? (

          isLoading ? (

            <CommissionOperationsTableSkeleton />

          ) : summary?.operaciones.length ? (

            <CommissionOperationsTable
              operations={
                summary.operaciones
              }
              onViewDetail={
                handleOpenOperationDetail
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

          )

        ) : (

          isLoadingBeneficiaries ? (

            <CommissionOperationsTableSkeleton />

          ) : beneficiarySummary?.socios
            .length ? (

            <CommissionBeneficiariesTable
              beneficiaries={beneficiarySummary.socios}
              onPayBeneficiary={handleOpenPayBeneficiaryModal}
            />

          ) : (

            <EmptyCommissionsState
              onResetFilters={() =>
                setFilters(
                  defaultDates,
                )
              }
            />

          )

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


    </div>
  );
}