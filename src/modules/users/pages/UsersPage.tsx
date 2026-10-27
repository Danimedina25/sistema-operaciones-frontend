import { useEffect, useMemo, useState } from 'react';
import { CanAccess } from '@/shared/components/CanAccess';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { Pagination } from '@/shared/components/ui/Pagination';
import { DeleteConfirmationModal } from '@/shared/components/ui/DeleteConfirmationModal';
import { UserForm } from '@/modules/users/components/UserForm';
import { UpdateUserEmailForm } from '@/modules/users/components/UpdateUserEmailForm';
import { UsersTable } from '@/modules/users/components/UsersTable';
import { useCreateUser } from '@/modules/users/hooks/use-create-user';
import { useUpdateUser } from '@/modules/users/hooks/use-update-user';
import { useUpdateUserEmail } from '@/modules/users/hooks/use-update-user-email';
import { useDeleteUser } from '@/modules/users/hooks/use-delete-user';
import { useUsers } from '@/modules/users/hooks/use-users';
import type { UserResponse } from '@/modules/users/types/users.types';
import {
  filterUsers,
  type UsersFilters as UsersFiltersType,
} from '@/modules/users/utils/users-filters';
import { getTotalPages, paginateItems } from '@/shared/utils/pagination';
import { CreateUserForm } from '../components/CreateUserForm';
import { useTableFilters } from '@/shared/hooks/use-table-filters';
import { roleLabels } from '@/shared/utils/role-labels';
import type { RoleName } from '@/modules/auth/types/auth.types';

const initialFilters: UsersFiltersType = {
  search: '',
  role: 'ALL',
  status: 'ALL',
};

export default function UsersPage() {
  const { filters, setFilters } = useTableFilters('table-filters:users', initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [emailUser, setEmailUser] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
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

  const { isDeleting, submitDeleteUser } = useDeleteUser({
    onSuccess: async () => {
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
      <PageHeader title="Usuarios" actions={<CanAccess roles={['ADMIN']}><Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>+ Nuevo usuario</Button></CanAccess>} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SearchFilterBar search={filters.search} onSearchChange={search => setFilters(current => ({ ...current, search }))}
          searchPlaceholder="Buscar por nombre o correo"
          activeFilters={[
            ...(filters.role !== 'ALL' ? [{ key: 'role', label: `Rol: ${roleLabels[filters.role]}`, onRemove: () => setFilters(current => ({ ...current, role: 'ALL' })) }] : []),
            ...(filters.status !== 'ALL' ? [{ key: 'status', label: filters.status === 'ACTIVE' ? 'Activos' : 'Inactivos', onRemove: () => setFilters(current => ({ ...current, status: 'ALL' })) }] : []),
          ]}
          filters={<div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Rol<select aria-label="Filtrar por rol" value={filters.role} onChange={event => setFilters(current => ({ ...current, role: event.target.value as RoleName | 'ALL' }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="ALL">Todos</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <label className="text-sm font-medium text-slate-700">Estado<select aria-label="Filtrar por estado" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value as UsersFiltersType['status'] }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="ALL">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option>
            </select></label>
          </div>} />

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
            onDelete={setDeletingUser}
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
      </section>

      <ActionDrawer
        open={isCreateModalOpen} busy={isCreating}
        title="Crear nuevo usuario"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CreateUserForm
          isSubmitting={isCreating}
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={submitCreateUser}
        />
      </ActionDrawer>

      <ActionDrawer
        open={Boolean(editingUser)} busy={isUpdating}
        title="Editar usuario"
        onClose={() => setEditingUser(null)}
      >
        {editingUser ? (
          <UserForm
            isSubmitting={isUpdating}
          onCancel={() => setEditingUser(null)}
            initialValues={{
              nombre: editingUser.nombre,
              roleId: editingUser.roleId,
              activo: editingUser.activo,
              roleName: editingUser.roleName,
              telefono: editingUser.telefono,
              appliesToNetwork:
                editingUser.commercialSettings?.appliesToNetwork ?? true,
              cuentaBancaria:
                editingUser.commercialSettings?.cuentaBancaria ?? '',
              banco: editingUser.commercialSettings?.banco ?? '',
              titularCuenta:
                editingUser.commercialSettings?.titularCuenta ?? '',
              porcentajeComision:
                editingUser.commercialSettings?.porcentajeComision
            }}
            onSubmit={(values) => submitUpdateUser(editingUser, values)}
            submitLabel="Guardar cambios"
          />
        ) : null}
      </ActionDrawer>

      <ActionDrawer
        open={Boolean(emailUser)} busy={isUpdatingEmail}
        title="Actualizar correo"
        onClose={() => setEmailUser(null)}
      >
        {emailUser ? (
          <UpdateUserEmailForm
            isSubmitting={isUpdatingEmail}
          onCancel={() => setEmailUser(null)}
            initialCorreo={emailUser.correo}
            onSubmit={(values) => submitUpdateUserEmail(emailUser, values)}
          />
        ) : null}
      </ActionDrawer>

      <DeleteConfirmationModal
        open={Boolean(deletingUser)}
        title={`Estás a punto de eliminar definitivamente al usuario "${deletingUser?.nombre ?? ''}" (${deletingUser?.correo ?? ''}).`}
        isSubmitting={isDeleting}
        onClose={() => setDeletingUser(null)}
        onConfirm={async () => {
          if (!deletingUser) return;
          const ok = await submitDeleteUser(deletingUser.id);
          if (ok) setDeletingUser(null);
        }}
      />
    </div>
  );
}
