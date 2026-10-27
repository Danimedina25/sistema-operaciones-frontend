import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CollectionTimeField } from './CollectionTimeField';
import userEvent from '@testing-library/user-event';

it('Enter avanza de hora a minutos y periodo sin enviar el formulario', async () => {
  const submit = vi.fn(event => event.preventDefault());
  render(<form onSubmit={submit}><CollectionTimeField onChange={vi.fn()} /><button type="submit">Guardar</button></form>);
  const user = userEvent.setup();
  const hour = screen.getByLabelText('Hora');
  const minutes = screen.getByLabelText('Minutos (00 a 59)');
  const period = screen.getByLabelText('Periodo');
  await user.click(hour);
  await user.keyboard('11{Enter}');
  expect(hour).toHaveValue('11');
  expect(minutes).toHaveFocus();
  await user.keyboard('45{Enter}');
  expect(period).toHaveFocus();
  expect(period).toHaveValue('AM');
  await user.keyboard('{Enter}');
  expect(period).toHaveFocus();
  expect(submit).not.toHaveBeenCalled();
});

it.each(['13', '24', '99', '00', 'abc'])('impide capturar la hora %s', value => {
  const change = vi.fn();
  render(<CollectionTimeField value="10:33" onChange={change} />);
  fireEvent.change(screen.getByLabelText('Hora'), { target: { value } });
  expect(screen.getByLabelText('Hora')).toHaveValue('10');
  expect(change).not.toHaveBeenCalled();
});

it.each(['60', '61', '99', '123', 'abc'])('impide capturar los minutos %s', value => {
  const change = vi.fn();
  render(<CollectionTimeField value="10:33" onChange={change} />);
  fireEvent.change(screen.getByLabelText('Minutos (00 a 59)'), { target: { value } });
  expect(screen.getByLabelText('Minutos (00 a 59)')).toHaveValue('33');
  expect(change).not.toHaveBeenCalled();
});

it.each([['AM', '00:30'], ['PM', '12:30']])('convierte las 12 %s a %s', (period, expected) => {
  const change = vi.fn();
  render(<CollectionTimeField onChange={change} />);
  fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Minutos (00 a 59)'), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('Periodo'), { target: { value: period } });
  expect(change).toHaveBeenLastCalledWith(expected);
});

it('permite cualquier minuto sin atajos y rechaza valores fuera de rango', () => {
  const change = vi.fn();
  render(<CollectionTimeField value="16:33" onChange={change} />);
  expect(screen.getByLabelText('Hora')).toHaveValue('04');
  expect(screen.getByLabelText('Periodo')).toHaveValue('PM');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Minutos (00 a 59)'), { target: { value: '07' } });
  expect(change).toHaveBeenLastCalledWith('16:07');
  fireEvent.change(screen.getByLabelText('Minutos (00 a 59)'), { target: { value: '60' } });
  expect(change).toHaveBeenLastCalledWith('16:07');
  fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '24' } });
  fireEvent.change(screen.getByLabelText('Minutos (00 a 59)'), { target: { value: '00' } });
  expect(change).toHaveBeenLastCalledWith('16:00');
});
