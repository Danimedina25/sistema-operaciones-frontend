import { useEffect, useMemo, useState } from 'react';
import { CanAccess } from '@/shared/components/CanAccess';
import { Modal } from '@/shared/components/ui/Modal';
import { Pagination } from '@/shared/components/ui/Pagination';
import { UserForm } from '@/modules/users/components/UserForm';
import { UpdateUserEmailForm } from '@/modules/users/components/UpdateUserEmailForm';
import { UsersFilters } from '@/modules/users/components/UsersFilters';
import { UsersTable } from '@/modules/users/components/UsersTable';
import { useCreateUser } from '@/modules/users/hooks/use-create-user';
import { useUpdateUser } from '@/modules/users/hooks/use-update-user';
import { useUpdateUserEmail } from '@/modules/users/hooks/use-update-user-email';
import { useUsers } from '@/modules/users/hooks/use-users';
import type { UserResponse } from '@/modules/users/types/users.types';
import {
  filterUsers,
  type UsersFilters as UsersFiltersType,
} from '@/modules/users/utils/users-filters';
import { getTotalPages, paginateItems } from '@/shared/utils/pagination';
import { CreateUserForm } from '../components/CreateUserForm';

const initialFilters: UsersFiltersType = {
  search: '',
  role: 'ALL',
  status: 'ALL',
};

export default function UsersPage() {
  const [filters, setFilters] = useState<UsersFiltersType>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [emailUser, setEmailUser] = useState<UserResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const {
    users,
    isLoading,
    processingUserId,
    fetchUsers,
    handleActivate,
    handleDeactivate,
    handleResendActivation,
  } = useUsers();

  const { isSubmitting: isCreating, submitCreateUser } = useCreateUser({
    onSuccess: async () => {
      setIsCreateModalOpen(false);
      await fetchUsers();
    },
  });

  const { isSubmitting: isUpdating, submitUpdateUser } = useUpdateUser({
    onSuccess: async () => {
      setEditingUser(null);
      await fetchUsers();
    },
  });

  const { isSubmitting: isUpdatingEmail, submitUpdateUserEmail } =
    useUpdateUserEmail({
      onSuccess: async () => {
        setEmailUser(null);
        await fetchUsers();
      },
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredUsers = useMemo(() => {
    return filterUsers(users, filters);
  }, [users, filters]);

  const totalPages = useMemo(() => {
    return getTotalPages(filteredUsers.length, pageSize);
  }, [filteredUsers.length, pageSize]);

  const paginatedUsers = useMemo(() => {
    return paginateItems(filteredUsers, currentPage, pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>
          <p className="mt-2 text-sm text-slate-500">
            Administra usuarios, estado de acceso y activaciones del sistema.
          </p>
        </div>

        <CanAccess roles={['ADMIN']}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Nuevo usuario
          </button>
        </CanAccess>
      </div>

      <UsersFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando usuarios...
        </div>
      ) : (
        <>
          <UsersTable
            users={paginatedUsers}
            processingUserId={processingUserId}
            onEdit={setEditingUser}
            onUpdateEmail={setEmailUser}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onResendActivation={handleResendActivation}
          />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={filteredUsers.length}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
        />
          
        </>
      )}

      <Modal
        open={isCreateModalOpen}
        title="Crear nuevo usuario"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateUserForm
          isSubmitting={isCreating}
          onSubmit={submitCreateUser}
        />
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        title="Editar usuario"
        onClose={() => setEditingUser(null)}
      >
        {editingUser ? (
          <UserForm
            isSubmitting={isUpdating}
            initialValues={{
              nombre: editingUser.nombre,
              roleId: editingUser.roleId,
              activo: editingUser.activo,
              roleName: editingUser.roleName,
              commissionPercentage:
                editingUser.commercialSettings?.commissionPercentage,
              appliesToNetwork:
                editingUser.commercialSettings?.appliesToNetwork ?? true,
            }}
            onSubmit={(values) => submitUpdateUser(editingUser, values)}
            submitLabel="Guardar cambios"
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(emailUser)}
        title="Actualizar correo"
        onClose={() => setEmailUser(null)}
      >
        {emailUser ? (
          <UpdateUserEmailForm
            isSubmitting={isUpdatingEmail}
            initialCorreo={emailUser.correo}
            onSubmit={(values) => submitUpdateUserEmail(emailUser, values)}
          />
        ) : null}
      </Modal>
    </div>
  );
}