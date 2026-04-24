export const paths = {
  login: '/login',
  activateAccount: '/activar-cuenta',
  verifyEmail: '/verificar-correo',
  requestPasswordReset: '/recuperar-password',
  resetPassword: '/restablecer-password',
  dashboard: '/',
  users: '/usuarios',
  clientes: '/clientes',
  bankAccounts: '/cuentas-bancarias',
  operations: '/operaciones',
  operationDetail: '/operaciones/:operationId',
} as const;

export const buildOperationDetailPath = (id: number | string) =>
  `/operaciones/${id}`;