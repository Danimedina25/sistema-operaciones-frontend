import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestReturnForm } from './RequestReturnForm';
import { readReturnExcel } from '../../utils/return-excel';
vi.mock('../../hooks/returns/use-operation-returns.js', () => ({ useReturnDestinationAccountSuggestions: () => ({ data: [] }) }));
vi.mock('../../utils/return-excel', async importOriginal => ({ ...await importOriginal<typeof import('../../utils/return-excel')>(), readReturnExcel: vi.fn() }));
const props = { operationId: 1, clientId: 2, clienteNombre: 'Cliente', montoTotalRetornar: 1000, montoSolicitado: 0, faltaPorSolicitar: 1000, isSubmitting: false };
async function upload() {
  await userEvent.upload(screen.getByLabelText('Archivo Excel de retornos'), new File(['xlsx'], 'retornos.xlsx'));
  await screen.findByText(/pagos detectados/);
}
beforeEach(() => {
  vi.mocked(readReturnExcel).mockResolvedValue([{ name: 'Retornos', rows: [
    { number: 1, cells: ['Monto', 'Tipo', 'Autorizado 1'].map(value => ({ value })) },
    { number: 2, cells: [100, 'Efectivo', 'Ana'].map(value => ({ value })) },
  ] }]);
});
describe('prellenado de retornos', () => {
  it('mantiene fijo el resumen y actualiza solicitado y faltante durante la captura', () => {
    render(<RequestReturnForm {...props} montoSolicitado={100} faltaPorSolicitar={900} onSubmit={vi.fn()} />);
    const summary = screen.getByTestId('return-live-summary');
    expect(summary).toHaveClass('sticky', 'top-0');
    expect(within(summary).getByText('$100.00')).toBeInTheDocument();
    expect(within(summary).getByText('$900.00')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '250' } });

    expect(within(summary).getByText('$350.00')).toBeInTheDocument();
    expect(within(summary).getByText('$650.00')).toBeInTheDocument();
  });

  it('cargar y prellenar no envía; permite editar y registra solo con el botón final', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<RequestReturnForm {...props} onSubmit={submit} />);
    await upload(); expect(submit).not.toHaveBeenCalled();
    await userEvent.dblClick(screen.getByRole('button', { name: 'Prellenar retornos' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Pago #/)).toHaveLength(1);
    expect(screen.getByText(/Excel: Retornos · fila 2/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '150' } });
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toMatchObject({ archivoNomina: null, pagos: [{ monto: 150, tipoPago: 'EFECTIVO', autorizadoParaRecibirEfectivo1: 'Ana' }] });
    expect(submit.mock.calls[0][0].pagos[0].id).toBeUndefined();
  });
  it('conserva captura manual y permite eliminar el pago importado', async () => {
    render(<RequestReturnForm {...props} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '75' } });
    await upload(); await userEvent.click(screen.getByText('Prellenar retornos'));
    expect(screen.getAllByText(/Pago #/)).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('1,000.00')[0]).toHaveValue('75');
    await userEvent.click(screen.getAllByText('Quitar')[1]);
    expect(screen.getAllByText(/Pago #/)).toHaveLength(1);
  });
  it('bloquea filas incompletas hasta corregir y respeta el saldo disponible', async () => {
    vi.mocked(readReturnExcel).mockResolvedValue([{ name: 'Datos', rows: [
      { number: 1, cells: ['Monto', 'Tipo'].map(value => ({ value })) },
      { number: 2, cells: [1500, 'Depósito'].map(value => ({ value })) },
    ] }]);
    const submit = vi.fn(); render(<RequestReturnForm {...props} onSubmit={submit} />);
    await upload(); await userEvent.click(screen.getByText('Prellenar retornos'));
    expect(screen.getByRole('button', { name: 'Crear solicitud de retorno' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('1,000.00'), { target: { value: '200' } });
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).not.toHaveBeenCalled();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'EFECTIVO');
    fireEvent.change(screen.getAllByPlaceholderText('Nombre completo')[1], { target: { value: 'Ana' } });
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  });
  it('permite completar una transferencia con CLABE sin exigir cuenta y conserva ceros', async () => {
    vi.mocked(readReturnExcel).mockResolvedValue([{ name: 'Banco', rows: [
      { number: 1, cells: ['Monto', 'Tipo', 'Banco', 'Titular'].map(value => ({ value })) },
      { number: 2, cells: [100, 'Transferencia', 'BBVA', 'Ana'].map(value => ({ value })) },
    ] }]);
    const submit = vi.fn(); render(<RequestReturnForm {...props} onSubmit={submit} />);
    await upload(); await userEvent.click(screen.getByText('Prellenar retornos'));
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('CLABE interbancaria'), { target: { value: '001234567890123456' } });
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].pagos[0]).toMatchObject({ clabe: '001234567890123456', cuenta: '', banco: 'BBVA', titular: 'Ana' });
  });
  it('exige corregir un identificador numérico incluso con otro identificador válido', async () => {
    vi.mocked(readReturnExcel).mockResolvedValue([{ name: 'Banco', rows: [
      { number: 1, cells: ['Monto', 'Tipo', 'Banco', 'Titular', 'Cuenta', 'CLABE'].map(value => ({ value })) },
      { number: 2, cells: [100, 'Transferencia', 'BBVA', 'Ana', 1234567890, '001234567890123456'].map(value => ({ value })) },
    ] }]);
    const submit = vi.fn(); render(<RequestReturnForm {...props} onSubmit={submit} />);
    await upload(); await userEvent.click(screen.getByText('Prellenar retornos'));
    expect(screen.getByPlaceholderText('Cuenta o tarjeta')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('Cuenta o tarjeta'), { target: { value: '001234567890' } });
    await userEvent.click(screen.getByRole('button', { name: 'Crear solicitud de retorno' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it('permite reasignar columnas desconocidas y elegir otra hoja sin enviar', async () => {
    vi.mocked(readReturnExcel).mockResolvedValue([
      { name: 'Notas', rows: [{ number: 1, cells: [{ value: 'Notas' }] }] },
      { name: 'Pagos', rows: [{ number: 1, cells: ['Valor', 'Modalidad'].map(value => ({ value })) }, { number: 2, cells: [25, 'Efectivo'].map(value => ({ value })) }] },
    ]);
    const submit = vi.fn(); render(<RequestReturnForm {...props} onSubmit={submit} />);
    await upload();
    const section = screen.getByRole('region', { name: 'Importación de retornos' });
    await userEvent.selectOptions(within(section).getByLabelText('Hoja'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Columna para Monto'), '0');
    await userEvent.selectOptions(screen.getByLabelText('Columna para Tipo de retorno'), '1');
    await userEvent.click(screen.getByText('Prellenar retornos'));
    expect(screen.getByPlaceholderText('1,000.00')).toHaveValue('25.00');
    expect(submit).not.toHaveBeenCalled();
  });
});
