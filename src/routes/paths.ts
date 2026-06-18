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
  returnsforpayment: '/retornos-por-pagar',

  returnRequestDetail:
    '/retornos-por-solicitar/:operationId',

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

export const buildReturnPaymentDetailPath = (
  id: number | string,
) => `/retornos-por-pagar/${id}`;