// src/modules/socioscomerciales/utils/commercial-partners-filters.ts

import type {
  CommercialPartnerResponse,
} from '@/modules/socioscomerciales/types/socioscomerciales.types';

export interface CommercialPartnersFilters {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export function filterCommercialPartners(
  commercialPartners: CommercialPartnerResponse[],
  filters: CommercialPartnersFilters,
): CommercialPartnerResponse[] {
  return commercialPartners.filter((partner) => {
    const search = filters.search.toLowerCase();

    const matchesSearch =
      !filters.search ||
      partner.nombre.toLowerCase().includes(search) ||
      partner.cuentaBancaria.toLowerCase().includes(search) ||
      partner.banco.toLowerCase().includes(search) ||
      partner.titularCuenta.toLowerCase().includes(search);

    const matchesStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && partner.activo) ||
      (filters.status === 'INACTIVE' && !partner.activo);

  
    return matchesSearch && matchesStatus;
  });
}