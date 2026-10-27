// src/modules/socioscomerciales/hooks/use-commercial-partners.ts

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  activateCommercialPartner,
  deactivateCommercialPartner,
  getCommercialPartners,
} from '@/modules/socioscomerciales/api/socioscomerciales.api';

import type {
  CommercialPartnerResponse,
} from '@/modules/socioscomerciales/types/socioscomerciales.types';

import { getApiErrorMessage } from '@/shared/utils/errors';

export function useCommercialPartners({ enabled = true }: { enabled?: boolean } = {}) {
  const [commercialPartners, setCommercialPartners] =
    useState<CommercialPartnerResponse[]>([]);

  const [isLoading, setIsLoading] = useState(enabled);

  const [processingPartnerId, setProcessingPartnerId] =
    useState<number | null>(null);

  const fetchCommercialPartners = useCallback(async () => {
    try {
      setIsLoading(true);

      const firstPage = await getCommercialPartners({ page: 0, size: 200 });
      const partners = [...firstPage.content];
      for (let page = 1; page < firstPage.totalPages; page += 1) {
        const response = await getCommercialPartners({ page, size: 200 });
        partners.push(...response.content);
      }
      setCommercialPartners(partners);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchCommercialPartners();
  }, [enabled, fetchCommercialPartners]);

  const handleActivate = async (partnerId: number) => {
    try {
      setProcessingPartnerId(partnerId);

      await activateCommercialPartner(partnerId);

      toast.success('Socio comercial activado exitosamente');

      await fetchCommercialPartners();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingPartnerId(null);
    }
  };

  const handleDeactivate = async (partnerId: number) => {
    try {
      setProcessingPartnerId(partnerId);

      await deactivateCommercialPartner(partnerId);

      toast.success('Socio comercial desactivado exitosamente');

      await fetchCommercialPartners();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingPartnerId(null);
    }
  };

  return {
    commercialPartners,
    isLoading,
    processingPartnerId,
    fetchCommercialPartners,
    handleActivate,
    handleDeactivate,
  };
}
