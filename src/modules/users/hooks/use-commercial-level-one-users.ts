import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getUsers } from '@/modules/users/api/users.api';
import type { UserResponse } from '@/modules/users/types/users.types';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useCommercialLevelOneUsers({ enabled = true }: { enabled?: boolean } = {}) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  const fetchUsers = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setUsers(await getUsers());
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const commercialLevelOneUsers = useMemo(
    () => users.filter((user) => user.activo && user.roleName === 'SOCIO_COMERCIAL'),
    [users],
  );

  return { commercialLevelOneUsers, isLoading };
}
