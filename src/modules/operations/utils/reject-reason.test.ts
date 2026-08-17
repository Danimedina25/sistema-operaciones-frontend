import { describe, expect, it } from 'vitest';
import { buildRejectReasonText } from './reject-reason';

describe('buildRejectReasonText', () => {
  it('usa el texto libre completo cuando el motivo es OTRO', () => {
    expect(buildRejectReasonText('OTRO', 'Firma ilegible en el documento')).toBe(
      'Firma ilegible en el documento',
    );
  });

  it('usa solo la etiqueta del motivo cuando no hay contexto adicional', () => {
    expect(buildRejectReasonText('COMPROBANTE_ILEGIBLE', '')).toBe('Comprobante ilegible');
  });

  it('combina la etiqueta del motivo con el contexto adicional', () => {
    expect(buildRejectReasonText('MONTO_INCORRECTO', 'Debía ser $500')).toBe(
      'Monto incorrecto: Debía ser $500',
    );
  });

  it('cubre todos los motivos predefinidos con una etiqueta legible', () => {
    expect(buildRejectReasonText('CUENTA_INCORRECTA', '')).toBe('Cuenta incorrecta');
    expect(buildRejectReasonText('MOVIMIENTO_NO_LOCALIZADO', '')).toBe(
      'Movimiento no localizado',
    );
    expect(buildRejectReasonText('COMPROBANTE_DUPLICADO', '')).toBe('Comprobante duplicado');
  });
});
