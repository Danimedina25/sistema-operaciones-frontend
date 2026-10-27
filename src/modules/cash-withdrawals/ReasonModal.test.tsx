import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ReasonModal } from './ReasonModal';

it('muestra el motivo faltante en el resumen y mantiene las acciones fuera del scroll', async () => {
  const confirm = vi.fn().mockResolvedValue(undefined);
  render(<ReasonModal open title="Rechazar retiro" description="Retiro de $300.00" confirmLabel="Rechazar retiro" onClose={vi.fn()} onConfirm={confirm} />);
  const dialog = screen.getByRole('dialog');
  const button = within(dialog).getByRole('button', { name: 'Rechazar retiro' });
  expect(dialog.querySelector('footer')).toContainElement(button);
  fireEvent.click(button);
  expect(within(screen.getByRole('region', { name: 'Resumen de la acción' })).getByRole('alert')).toHaveTextContent('Indica el motivo');
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: ' No llegó el efectivo ' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(button);
  await waitFor(() => expect(confirm).toHaveBeenCalledWith('No llegó el efectivo'));
});

it('bloquea Escape, cancelar y doble envío mientras procesa el rechazo', async () => {
  let finish!: () => void;
  const confirm = vi.fn().mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const close = vi.fn();
  render(<ReasonModal open title="Rechazar retiro" description="Retiro de $300.00" confirmLabel="Rechazar retiro" onClose={close} onConfirm={confirm} />);
  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'No llegó' } });
  fireEvent.click(screen.getByRole('button', { name: 'Rechazar retiro' }));
  fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  expect(close).not.toHaveBeenCalled();
  expect(confirm).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});
