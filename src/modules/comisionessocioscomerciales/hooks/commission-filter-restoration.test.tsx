import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useCommercialPartnerCommissionsPage } from './use-commercial-partner-commissions-page';
import { useCommercialPartnerCommissionPaymentsPage } from './use-commercial-partner-commission-payments-page';

const mocks = vi.hoisted(() => ({ fetchSummary: vi.fn() }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 1 } }) }));
vi.mock('./use-commission-summary', () => ({ useCommissionSummary: () => mocks }));
vi.mock('./use-beneficiary-summary', () => ({ useBeneficiarySummary: () => mocks }));
vi.mock('./use-operation-detail', () => ({ useOperationDetail: () => ({}) }));
vi.mock('./use-pay-commission', () => ({ usePayCommission: () => ({}) }));
vi.mock('./use-generate-commissions', () => ({ useGenerateCommissions: () => ({}) }));
vi.mock('./use-pay-beneficiary-commissions', () => ({ usePayBeneficiaryCommissions: () => ({}) }));

beforeEach(() => { window.sessionStorage.clear(); vi.clearAllMocks(); });

it.each([
  ['commercial-partner-commissions', useCommercialPartnerCommissionsPage],
  ['commercial-partner-commission-payments', useCommercialPartnerCommissionPaymentsPage],
] as const)('consulta el rango restaurado en %s', (table, usePage) => {
  const selected = { startDate: '2026-08-01', endDate: '2026-08-15' };
  window.sessionStorage.setItem(`table-filters:${table}:v2:user:1`, JSON.stringify(selected));
  const { result } = renderHook(() => usePage());
  expect(result.current.filters).toEqual(selected);
  expect(mocks.fetchSummary).toHaveBeenCalledWith(selected);
});
