import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { CardlessCodePanel } from './CardlessCodePanel';
import type { ReturnPaymentResponse, ReturnInstallment } from '../../types/operations.types.ts';
const mock = vi.hoisted(() => ({ roles: ['JEFA_CUENTAS'], post: vi.fn(), patch: vi.fn(), get: vi.fn(), success: vi.fn(), scroll: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: mock.success } }));
vi.mock('@/modules/auth/store/auth.context', () => ({ useAuth: () => ({ user: { userId: 2, roles: mock.roles } }) }));
vi.mock('@/shared/lib/axios', () => ({ api: { post: mock.post, patch: mock.patch, get: mock.get } }));
vi.mock('@/modules/bank-accounts/hooks/use-bank-accounts', () => ({ useBankAccounts: () => ({ accounts: [{ id: 4, banco: 'BANORTE', titular: 'Prueba', numeroCuenta: '1234', activo: true }], isLoading: false }) }));
vi.mock('../../api/operations-storage.api', () => ({ uploadOperationProof: vi.fn(async () => ({ downloadUrl: 'https://example.com/proof.png' })) }));
vi.mock('@/shared/components/ui/ReceiptUploadField', () => ({ ReceiptUploadField: ({ onChange }: { onChange: (file: File) => void }) => <input type="file" aria-label="Comprobante" onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} /> }));
const request = { id: 39, operationId: 47, monto: 300, montoSolicitado: 300, montoDisponible: 300 } as ReturnPaymentResponse;
const code = { id: 9, monto: 100, codigoParaCliente: true, codigoRetiroSinTarjeta: '5678', estatus: 'PROGRAMADA' } as ReturnInstallment;
beforeEach(() => { mock.roles = ['JEFA_CUENTAS']; mock.post.mockReset().mockResolvedValue({}); mock.patch.mockReset().mockResolvedValue({}); mock.get.mockReset().mockImplementation(async (url: string) => ({ data: { data: url.includes('cardless-accounts') ? [{ id: 4, banco: 'BANORTE', titular: 'Prueba', numeroCuenta: '1234', activo: true }] : { solicitud: { ...request, montoDisponible: 200 }, parcialidades: [code] } } })); mock.success.mockReset(); mock.scroll.mockReset(); Element.prototype.scrollIntoView = mock.scroll; });
function mount(installments: ReturnInstallment[] = [], onClose = vi.fn()) {
 const changed = vi.fn();
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 render(<QueryClientProvider client={client}><CardlessCodePanel request={request} installments={installments} onChanged={changed} onClose={onClose} /></QueryClientProvider>);
 return changed;
}
for (const role of ['JEFA_CUENTAS','AUXILIAR_CUENTAS']) it(`${role} registra una parcialidad con cuenta y código sin fecha ni conteo`, async () => {
 mock.roles = [role]; const changed = mount();
 await waitFor(() => expect(screen.getByRole('combobox', { name: 'Cuenta bancaria origen' })).not.toBeDisabled());
 const input = screen.getByRole('combobox', { name: 'Cuenta bancaria origen' }); fireEvent.focus(input); await screen.findByRole('option'); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
 fireEvent.change(screen.getByLabelText('Monto del código'), { target: { value: '100' } });
 expect(screen.getByText(/Parcialidad. Quedarán/)).toHaveTextContent('$200.00');
 fireEvent.change(screen.getByLabelText('Código o referencia del banco'), { target: { value: '5678' } });
 fireEvent.click(screen.getByRole('button', { name: 'Registrar y notificar al socio' }));
 await waitFor(() => expect(changed).toHaveBeenCalledOnce());
 expect(mock.post).toHaveBeenCalledExactlyOnceWith('/api/operations/returns/requests/39/installments', { monto: 100, cuentaOrigenId: 4, codigoRetiroSinTarjeta: '5678' });
});
it('muestra el exceso en el resumen e impide registrar', () => {
 mount(); fireEvent.change(screen.getByLabelText('Monto del código'), { target: { value: '301' } });
 expect(screen.getByRole('alert')).toHaveTextContent('$300.00'); expect(screen.getByRole('button', { name: 'Registrar y notificar al socio' })).toBeDisabled();
});
it('Cajas no puede generar ni confirmar códigos', () => {
 mock.roles = ['JEFA_CAJAS']; mount([code]); expect(screen.queryByLabelText('Monto del código')).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Confirmar cobro bancario' })).not.toBeInTheDocument();
});
it('el Socio reporta el uso sin cuenta ni débito bancario', async () => {
 mock.roles = ['SOCIO_COMERCIAL']; mount([code]);
 fireEvent.click(screen.getByRole('button', { name: 'Marcar como utilizado' }));
 const dialog = screen.getByRole('dialog', { name: 'Confirmar uso del código' });
 expect(mock.patch).not.toHaveBeenCalled();
 expect(within(dialog).getByText('$100.00')).toBeInTheDocument();
 expect(within(dialog).getByText('Código de retiro')).toBeInTheDocument();
 expect(within(dialog).getByText('5678')).toBeInTheDocument();
 fireEvent.click(within(dialog).getByRole('button', { name: 'Marcar como utilizado' }));
 await waitFor(() => expect(mock.patch).toHaveBeenCalledWith('/api/operations/returns/installments/9/confirm'));
 expect(screen.queryByRole('button', { name: 'Confirmar cobro bancario' })).not.toBeInTheDocument();
});
it('exige comprobante para confirmar el cobro bancario', async () => {
 mount([code]); fireEvent.click(screen.getByRole('button', { name: 'Confirmar cobro bancario' }));
 const confirm = screen.getByRole('button', { name: 'Confirmar y descontar del banco' }); expect(confirm).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Comprobante'), { target: { files: [new File(['proof'], 'proof.png', { type: 'image/png' })] } });
 fireEvent.click(confirm);
 await waitFor(() => expect(mock.patch).toHaveBeenCalledExactlyOnceWith('/api/operations/returns/installments/9/cardless-bank-confirm', { comprobanteUrl: 'https://example.com/proof.png' }));
});

async function registerCode(amount = '100') {
 await waitFor(() => expect(screen.getByRole('combobox', { name: 'Cuenta bancaria origen' })).not.toBeDisabled());
 const input = screen.getByRole('combobox', { name: 'Cuenta bancaria origen' });
 fireEvent.focus(input); await screen.findByRole('option'); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
 fireEvent.change(screen.getByLabelText('Monto del código'), { target: { value: amount } });
 fireEvent.change(screen.getByLabelText('Código o referencia del banco'), { target: { value: '5678' } });
 fireEvent.click(screen.getByRole('button', { name: 'Registrar y notificar al socio' }));
}
it('notifica éxito y desplaza a las parcialidades sin cerrar si queda saldo', async () => {
 const close = vi.fn(); mount([], close); await registerCode();
 await waitFor(() => expect(mock.scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }));
 expect(screen.getByRole('heading', { name: 'Códigos de esta solicitud' })).toHaveFocus();
 expect(mock.success).toHaveBeenCalledWith('Código registrado y notificado al socio comercial.', { duration: 6000 });
 expect(close).not.toHaveBeenCalled();
});
it('cierra al cubrir el saldo según el servidor y conserva el aviso global', async () => {
 mock.get.mockImplementation(async (url: string) => ({ data: { data: url.includes('cardless-accounts') ? [{ id: 4, banco: 'BANORTE', titular: 'Prueba', numeroCuenta: '1234', activo: true }] : { solicitud: { ...request, montoDisponible: 0 }, parcialidades: [code] } } }));
 const close = vi.fn(); mount([], close); await registerCode();
 await waitFor(() => expect(close).toHaveBeenCalledOnce());
 expect(mock.success).toHaveBeenCalledWith('Código registrado y notificado al socio comercial.', { duration: 6000 });
 expect(mock.scroll).not.toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
 expect(mock.get).toHaveBeenCalledWith('/api/operations/returns/requests/39');
});
it('no cierra, no desplaza ni anuncia éxito cuando el registro falla', async () => {
 mock.post.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Código duplicado' } } });
 const close = vi.fn(); mount([], close); await registerCode();
 expect(await screen.findByRole('alert')).toHaveTextContent('Código duplicado');
 expect(close).not.toHaveBeenCalled(); expect(mock.scroll).not.toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }); expect(mock.success).not.toHaveBeenCalled();
});

it('cancelar la confirmación propia no registra el uso y devuelve el foco al botón', () => {
 mock.roles = ['SOCIO_COMERCIAL']; mount([code]);
 const trigger = screen.getByRole('button', { name: 'Marcar como utilizado' });
 fireEvent.click(trigger);
 const dialog = screen.getByRole('dialog', { name: 'Confirmar uso del código' });
 fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(mock.patch).not.toHaveBeenCalled(); expect(trigger).toHaveFocus();
});
it('Escape cierra solo la confirmación y no registra el uso', () => {
 mock.roles = ['SOCIO_COMERCIAL']; mount([code]);
 fireEvent.click(screen.getByRole('button', { name: 'Marcar como utilizado' }));
 fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(mock.patch).not.toHaveBeenCalled();
});
it('un error mantiene abierto el modal con el mensaje y permite reintentar', async () => {
 mock.roles = ['SOCIO_COMERCIAL']; mock.patch.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'No se pudo confirmar el uso' } } }); mount([code]);
 fireEvent.click(screen.getByRole('button', { name: 'Marcar como utilizado' }));
 const dialog = screen.getByRole('dialog');
 fireEvent.click(within(dialog).getByRole('button', { name: 'Marcar como utilizado' }));
 expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se pudo confirmar el uso');
 expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('permite editar solo códigos sin uso ni cobro', async () => {
 mount([{ ...code, cuentaOrigenId: 4 }]);
 fireEvent.click(screen.getByRole('button', { name: 'Editar código' }));
 const dialog = screen.getByRole('dialog', { name: 'Editar código de retiro' });
 fireEvent.change(within(dialog).getByLabelText('Editar código de retiro'), { target: { value: '9999' } });
 fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
 await waitFor(() => expect(mock.patch).toHaveBeenCalledWith('/api/operations/returns/installments/9/cardless-code', { monto: 100, cuentaOrigenId: 4, codigoRetiroSinTarjeta: '9999' }));
});
it('oculta edición y eliminación después del uso o cobro', () => {
 mount([{ ...code, confirmadoPorSocio: true }, { ...code, id: 10, fechaCobroBancario: '2026-10-19T12:00:00' }]);
 expect(screen.queryByRole('button', { name: 'Editar código' })).not.toBeInTheDocument();
 expect(screen.queryByRole('button', { name: 'Eliminar código' })).not.toBeInTheDocument();
});
it('exige motivo y palabra para eliminar liberando la reserva', async () => {
 mount([code]); fireEvent.click(screen.getByRole('button', { name: 'Eliminar código' }));
 const dialog = screen.getByRole('dialog', { name: 'Eliminar código de retiro' });
 const button = within(dialog).getByRole('button', { name: 'Eliminar código' }); expect(button).toBeDisabled();
 fireEvent.change(within(dialog).getByLabelText('Verificación bancaria y motivo'), { target: { value: 'Cancelado sin uso en el banco' } });
 fireEvent.change(within(dialog).getByLabelText('Escribe ELIMINAR para confirmar'), { target: { value: 'ELIMINAR' } });
 fireEvent.click(button);
 await waitFor(() => expect(mock.patch).toHaveBeenCalledWith('/api/operations/returns/installments/9/cancel', { motivo: 'Cancelado sin uso en el banco' }));
});

for (const state of [
 { name: 'Saldo reservado', socio: false, bank: undefined, cancelled: false, tone: 'bg-amber-100' },
 { name: 'Por verificar cobro', socio: true, bank: undefined, cancelled: false, tone: 'bg-amber-100' },
 { name: 'Falta confirmación del socio', socio: false, bank: '2026-10-19T12:00:00', cancelled: false, tone: 'bg-amber-100' },
 { name: 'Concluido', socio: true, bank: '2026-10-19T12:00:00', cancelled: false, tone: 'bg-emerald-100' },
 { name: 'Cancelado', socio: false, bank: undefined, cancelled: true, tone: 'bg-slate-100' },
]) it(`presenta el estado ${state.name} con su etiqueta y seguimiento`, () => {
 mount([{ ...code, confirmadoPorSocio: state.socio, fechaCobroBancario: state.bank, estatus: state.cancelled ? 'CANCELADA' : 'PROGRAMADA', cuentaOrigenNombre: 'BANORTE ••1234 · Beneficiario' }]);
 const card = screen.getByRole('region', { name: 'Código de retiro #9' });
 expect(within(card).getAllByText(state.name)[0]).toHaveClass(state.tone);
 expect(within(card).getByText('BANORTE ••1234 · Beneficiario')).toBeInTheDocument();
 expect(within(card).getByText('Código de retiro')).toBeInTheDocument();
 if (state.cancelled) {
  expect(within(card).queryByText('Por confirmar uso')).not.toBeInTheDocument();
  expect(within(card).getByText(/La reserva fue liberada/)).toBeInTheDocument();
 } else {
  expect(within(card).getByText(state.socio ? 'Uso reportado' : 'Por confirmar uso')).toHaveClass(state.socio ? 'bg-emerald-100' : 'bg-amber-100');
  const bankLabels = within(card).getAllByText(state.bank ? 'Cobro confirmado' : 'Por verificar cobro');
  expect(bankLabels[bankLabels.length - 1]).toHaveClass(state.bank ? 'bg-emerald-100' : 'bg-amber-100');
 }
});
