import { describe, expect, it } from 'vitest';
import { validateDestinationAccountIdentifiers } from './return-destination-account';

describe('validateDestinationAccountIdentifiers', () => {
  it('acepta una cuenta o tarjeta válida sin CLABE', () => {
    expect(
      validateDestinationAccountIdentifiers('1234567890123456', ''),
    ).toEqual({});
  });

  it('acepta una CLABE válida sin cuenta o tarjeta', () => {
    expect(
      validateDestinationAccountIdentifiers('', '123456789012345678'),
    ).toEqual({});
  });

  it('requiere al menos uno de los dos identificadores', () => {
    expect(validateDestinationAccountIdentifiers('', '')).toEqual({
      cuenta: 'Ingresa un número de cuenta/tarjeta o una CLABE interbancaria',
    });
  });

  it('valida cada campo proporcionado aunque el otro sea válido', () => {
    expect(
      validateDestinationAccountIdentifiers(
        '123',
        '123456789012345678',
      ),
    ).toEqual({
      cuenta: 'El número de cuenta o tarjeta debe tener entre 10 y 18 dígitos',
    });

    expect(
      validateDestinationAccountIdentifiers(
        '1234567890',
        '123',
      ),
    ).toEqual({
      clabe: 'La CLABE debe tener exactamente 18 dígitos',
    });
  });
});
