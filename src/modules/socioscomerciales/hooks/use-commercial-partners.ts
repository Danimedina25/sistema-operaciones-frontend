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

export function useCommercialPartners() {
  const [commercialPartners, setCommercialPartners] =
    useState<CommercialPartnerResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [processingPartnerId, setProcessingPartnerId] =
    useState<number | null>(null);

  const fetchCommercialPartners = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getCommercialPartners({ size: 200 });

      setCommercialPartners(response.content);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommercialPartners();
  }, [fetchCommercialPartners]);

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