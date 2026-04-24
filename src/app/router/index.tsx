import { createBrowserRouter } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute';
import { RoleGuard } from '@/routes/guards/RoleGuard';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ActivateAccountPage from '@/modules/auth/pages/ActivateAccountPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import UsersPage from '@/modules/users/pages/UsersPage';
import BankAccountsPage from '@/modules/bank-accounts/pages/BankAccountsPage';
import OperationsPage from '@/modules/operations/pages/OperationsPage';
import OperationDetailPage from '@/modules/operations/pages/OperationDetailPage';
import DashboardPage from '@/app/pages/DashboardPage';
import ClientesPage from '@/modules/clientes/pages/ClientesPage';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: paths.login,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: paths.activateAccount,
    element: <ActivateAccountPage />,
  },
  {
    path: paths.verifyEmail,
    element: <VerifyEmailPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: paths.dashboard,
            element: <DashboardPage />,
          },

          {
            element: <RoleGuard allowedRoles={['ADMIN']} />,
            children: [
              {
                path: paths.users,
                element: <UsersPage />,
              },
            ],
          },
           {
            element: <RoleGuard allowedRoles={['ADMIN']} />,
            children: [
              {
                path: paths.clientes,
                element: <ClientesPage />,
              },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'AUXILIAR_CUENTAS']} />,
            children: [
              {
                path: paths.bankAccounts,
                element: <BankAccountsPage />,
              },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL']} />,
            children: [
              {
                path: paths.operations,
                element: <OperationsPage />,
              },
            ],
          },

          {
            element: <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'SOCIO_COMERCIAL', 'JEFA_CAJAS', 'AUXILIAR_CUENTAS']} />,
            children: [
              {
                path: paths.operationDetail,
                element: <OperationDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);