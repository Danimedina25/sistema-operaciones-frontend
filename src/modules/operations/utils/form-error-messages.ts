/** Mensajes de validación con nombres legibles, sin exponer claves internas. */
const fieldLabels: Record<string, string> = {
  monto: 'Monto', tipoPago: 'Tipo de pago', cuentaDestinoId: 'Cuenta destino', cuentaOrigenId: 'Cuenta origen',
  fechaComprobante: 'Fecha del comprobante', comprobante: 'Comprobante', numeroCheque: 'Número de cheque',
  bancoEmisor: 'Banco emisor', emisor: 'Emisor', beneficiario: 'Beneficiario', banco: 'Banco destino',
  titular: 'Titular', cuenta: 'Cuenta o tarjeta', clabe: 'CLABE', autorizadoParaRecibirEfectivo1: 'Persona autorizada',
};
export function formErrorMessages(errors: object): string[] {
  return Object.entries(errors).flatMap(([field, value]) => {
    const message = typeof value === 'string' ? value : value?.message;
    return typeof message === 'string' && message ? [`${fieldLabels[field] ?? 'Dato requerido'}: ${message}`] : [];
  });
}
