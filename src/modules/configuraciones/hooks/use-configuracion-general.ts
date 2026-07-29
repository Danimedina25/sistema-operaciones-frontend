// src/modules/configuraciones/hooks/use-configuracion-general.ts

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { getConfiguracionGeneral } from '@/modules/configuraciones/api/configuraciones.api';
import type { ConfiguracionGeneralResponse } from '@/modules/configuraciones/types/configuraciones.types';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useConfiguracionGeneral({ enabled = true }: { enabled?: boolean } = {}) {
  const [configuracionGeneral, setConfiguracionGeneral] =
    useState<ConfiguracionGeneralResponse | null>(null);

  const [isLoading, setIsLoading] = useState(enabled);

  const fetchConfiguracionGeneral = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getConfiguracionGeneral();

      setConfiguracionGeneral(response);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchConfiguracionGeneral();
  }, [enabled, fetchConfiguracionGeneral]);

  return {
    configuracionGeneral,
    isLoading,
    fetchConfiguracionGeneral,
  };
}
