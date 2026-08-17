import { createBrowserRouter } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { ROUTE_ACCESS } from '@/shared/constants/access-control';

import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute';
import { RoleGuard } from '@/routes/guards/RoleGuard';

import { AdminLayout } from '@/shared/components/layout/AdminLayout';

import LoginPage from '@/modules/auth/pages/LoginPage';
import ActivateAccountPage from '@/modules/auth/pages/ActivateAccountPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';

import DashboardPage from '@/app/pages/DashboardPage';

import UsersPage from '@/modules/users/pages/UsersPage';
import ClientesPage from '@/modules/clientes/pages/ClientesPage';

import BankAccountsPage from '@/modules/bank-accounts/pages/BankAccountsPage';

import OperationsPage from '@/modules/operations/pages/OperationsPage';
import OperationDetailPage from '@/modules/operations/pages/OperationDetailPage';

import ReturnsForRequestPage from '@/modules/operations/pages/ReturnsForRequestPage';
import ReturnsForPaymentPage from '@/modules/operations/pages/ReturnsForPaymentPage';
import CommercialPartnersPage from '@/modules/socioscomerciales/pages/CommercialPartnersPage';
import CommercialPartnerCommissionsPage from '@/modules/comisionessocioscomerciales/pages/CommercialPartnerCommissionsPage';
import MyCommercialPartnerCommissionsPage from '@/modules/comisionessocioscomerciales/pages/MyCommercialPartnerCommissionsPage';
import DailyCashCutPage from '@/modules/corte/pages/DailyCashCutPage';
import ReturnsRequestedPage from '@/modules/operations/pages/ReturnsRequestedPage';
import TodayCashDeliveriesPage from '@/modules/operations/pages/TodayCashDeliveriesPage';
import ConfiguracionesPage from '@/modules/configuraciones/pages/ConfiguracionesPage';

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
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.corte} />,
            children: [
              {
                path: paths.corte,
                element: <DailyCashCutPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.users} />,
            children: [
              {
                path: paths.users,
                element: <UsersPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.clientes} />,
            children: [
              {
                path: paths.clientes,
                element: <ClientesPage />,
              },
              {
                path: paths.mycomercialpartners,
                element: <CommercialPartnersPage />,
              },
              {
                path: paths.returnsforrequest,
                element: <ReturnsForRequestPage />,
              },
              {
                path: paths.returnsRequested,
                element: <ReturnsRequestedPage />,
              },
              {
                path: paths.returnRequestDetail,
                element: <OperationDetailPage />,
              },
              {
                path: paths.returnsRequestedDetail,
                element: <OperationDetailPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.miscomisiones} />,
            children: [
              {
                path: paths.miscomisiones,
                element: <MyCommercialPartnerCommissionsPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.operations} />,
            children: [
              {
                path: paths.operations,
                element: <OperationsPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.bankAccounts} />,
            children: [
              {
                path: paths.bankAccounts,
                element: <BankAccountsPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.comisionessocios} />,
            children: [
              {
                path: paths.comisionessocios,
                element: <CommercialPartnerCommissionsPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.configuraciones} />,
            children: [
              {
                path: paths.configuraciones,
                element: <ConfiguracionesPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.operationDetail} />,
            children: [
              {
                path: paths.operationDetail,
                element: <OperationDetailPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.returnsforpayment} />,
            children: [
              {
                path: paths.returnsforpayment,
                element: <ReturnsForPaymentPage />,
              },
              {
                path: paths.devolutionDetail,
                element: <OperationDetailPage />,
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={ROUTE_ACCESS.todayCashDeliveries} />,
            children: [
              {
                path: paths.todayCashDeliveries,
                element: <TodayCashDeliveriesPage />,
              },
            ],
          },
        ],
      },
    ],
  }
]);