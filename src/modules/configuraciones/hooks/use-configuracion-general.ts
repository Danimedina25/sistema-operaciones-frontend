// src/modules/configuraciones/hooks/use-configuracion-general.ts

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { getConfiguracionGeneral } from '@/modules/configuraciones/api/configuraciones.api';
import type { ConfiguracionGeneralResponse } from '@/modules/configuraciones/types/configuraciones.types';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useConfiguracionGeneral() {
  const [configuracionGeneral, setConfiguracionGeneral] =
    useState<ConfiguracionGeneralResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

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
    fetchConfiguracionGeneral();
  }, [fetchConfiguracionGeneral]);

  return {
    configuracionGeneral,
    isLoading,
    fetchConfiguracionGeneral,
  };
}
