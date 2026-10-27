import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { CreateClienteForm } from './CreateClienteForm';

it('el botón fijo envía el formulario con su propietario y conserva datos si falla', async () => {
  const onSubmit = vi.fn().mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'Cliente duplicado' } } }).mockResolvedValueOnce(undefined);
  render(<ActionDrawer open title="Nuevo cliente" onClose={vi.fn()}>
    <CreateClienteForm isSubmitting={false} currentUserId={7} levelOneUsers={[]} canAssignLevelOne={false} onCancel={vi.fn()} onSubmit={onSubmit} />
  </ActionDrawer>);
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Ej. Cliente primario'), 'Cliente de prueba');
  await user.click(screen.getByRole('button', { name: 'Crear cliente' }));
  expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Cliente de prueba', userId: 7 });
  expect(screen.getByRole('alert')).toHaveTextContent('Cliente duplicado');
  expect(screen.getByPlaceholderText('Ej. Cliente primario')).toHaveValue('Cliente de prueba');
  await act(async () => { await user.click(screen.getByRole('button', { name: 'Crear cliente' })); });
  expect(onSubmit).toHaveBeenCalledTimes(2);
});
