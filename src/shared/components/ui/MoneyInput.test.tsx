import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MoneyInput } from './MoneyInput';
import { moneyInputToNumber, validateAmountInput, validateCashAmountInput } from '@/shared/utils/money-input';

function Harness() {
  const [value, setValue] = useState('');
  return <MoneyInput ariaLabel="Monto" value={value} onChange={setValue} />;
}

function field() {
  return screen.getByLabelText('Monto') as HTMLInputElement;
}

describe('MoneyInput', () => {
  it('separa miles con comas mientras se escribe', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '1234567' } });
    expect(field().value).toBe('1,234,567');
  });

  it('admite hasta dos decimales', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '12500.509' } });
    expect(field().value).toBe('12,500.50');
  });

  it('ignora letras y símbolos', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '$1a2b3' } });
    expect(field().value).toBe('123');
    fireEvent.change(field(), { target: { value: 'abc' } });
    expect(field().value).toBe('');
  });

  it('completa los centavos al salir del campo', () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: '1500' } });
    fireEvent.blur(field());
    expect(field().value).toBe('1,500.00');
  });

  it('el texto con comas se valida y se convierte al número que se envía', () => {
    expect(validateAmountInput('12,500.50')).toBeNull();
    expect(moneyInputToNumber('12,500.50')).toBe(12500.5);
    expect(moneyInputToNumber('')).toBeNull();
  });
  it('en efectivo sólo acepta centavos .00 o .50', () => {
    expect(validateCashAmountInput('1,500.50')).toBeNull();
    expect(validateCashAmountInput('1,500')).toBeNull();
    expect(validateCashAmountInput('1,500.5')).toBeNull();
    expect(validateCashAmountInput('1,500.25')).toMatch(/\.00 o \.50/);
    expect(validateCashAmountInput('0.99')).toMatch(/\.00 o \.50/);
  });
});
