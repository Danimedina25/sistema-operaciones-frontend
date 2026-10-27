import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

it('exige ELIMINAR y bloquea cierre y reenvío mientras elimina', async () => {
  let finish!: () => void;
  const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const onClose = vi.fn();
  render(<DeleteConfirmationModal open title="Cliente de prueba" isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />);
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeDisabled();
  await user.type(screen.getByRole('textbox'), 'ELIMINAR');
  await user.dblClick(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  await user.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => finish());
});
