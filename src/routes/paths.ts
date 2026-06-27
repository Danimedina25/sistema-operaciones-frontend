export const paths = {
  login: '/login',
  activateAccount: '/activar-cuenta',
  verifyEmail: '/verificar-correo',
  requestPasswordReset: '/recuperar-password',
  resetPassword: '/restablecer-password',

  dashboard: '/',
  corte: '/corte',

  users: '/usuarios',
  clientes: '/clientes',
  bankAccounts: '/cuentas-bancarias',
  mycomercialpartners: '/socioscomerciales',

  operations: '/operaciones',
  operationDetail: '/operaciones/:operationId',

  returnsforrequest: '/retornos-por-solicitar',
  returnsRequested: '/retornos-solicitados',
  returnsforpayment: '/retornos-por-pagar',

  returnRequestDetail:
    '/retornos-por-solicitar/:operationId',
  returnsRequestedDetail:
  '/retornos-solicitados/:operationId',

  devolutionDetail:
    '/retornos-por-pagar/:operationId',

  comisionessocios: '/comisiones-socios',
  miscomisiones: '/mis-comisiones',
} as const;

export const buildOperationDetailPath = (
  id: number | string,
) => `/operaciones/${id}`;

export const buildReturnRequestDetailPath = (
  id: number | string,
) => `/retornos-por-solicitar/${id}`;

export const buildReturnsForPaymentDetailPath = (
  id: number | string,
) => `/retornos-por-pagar/${id}`;

export const buildReturnsRequestedDetailPath = (
  id: number | string,
) => `/retornos-solicitados/${id}`;