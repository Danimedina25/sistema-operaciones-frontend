import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  activateUser,
  deactivateUser,
  getUsers,
  resendActivationEmail,
} from '@/modules/users/api/users.api';
import type { UserResponse } from '@/modules/users/types/users.types';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function useUsers() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleActivate = async (userId: number) => {
    try {
      setProcessingUserId(userId);
      const updatedUser = await activateUser(userId);

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updatedUser : user)),
      );

      toast.success('Usuario activado correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeactivate = async (userId: number) => {
    try {
      setProcessingUserId(userId);
      const updatedUser = await deactivateUser(userId);

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updatedUser : user)),
      );

      toast.success('Usuario desactivado correctamente');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleResendActivation = async (userId: number) => {
    try {
      setProcessingUserId(userId);
      await resendActivationEmail(userId);
      toast.success('Correo de activación reenviado');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  return {
    users,
    isLoading,
    processingUserId,
    fetchUsers,
    handleActivate,
    handleDeactivate,
    handleResendActivation,
  };
}