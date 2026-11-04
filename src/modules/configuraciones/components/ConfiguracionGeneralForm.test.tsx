import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfiguracionGeneralForm } from './ConfiguracionGeneralForm';

const initialValues = { porcentajeComisionOficina: 1.5, horasPendienteAtencion: 4, horasPendienteUrgente: 24, horasOperacionDetenida: 48, diaPagoComisiones: 6 };

describe('ConfiguracionGeneralForm · semáforo de pendientes', () => {
  it('guarda las horas configuradas junto con la comisión', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConfiguracionGeneralForm isSubmitting={false} initialValues={initialValues} onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/Atender pronto desde/)).toHaveValue('4');
    fireEvent.change(screen.getByLabelText(/Urgente desde/), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ porcentajeComisionOficina: 1.5, horasPendienteAtencion: 4, horasPendienteUrgente: 12, horasOperacionDetenida: 48, diaPagoComisiones: 6 });
  });

  it('no permite que urgente llegue antes que atender pronto', async () => {
    const onSubmit = vi.fn();
    render(<ConfiguracionGeneralForm isSubmitting={false} initialValues={initialValues} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Urgente desde/), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Las horas para urgente deben ser mayores que las de atender pronto')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('guarda las horas para operación detenida y el día de pago de comisiones', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConfiguracionGeneralForm isSubmitting={false} initialValues={initialValues} onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Día de pago de comisiones')).toHaveValue('6');
    fireEvent.change(screen.getByLabelText('Operación detenida después de'), { target: { value: '72' } });
    fireEvent.change(screen.getByLabelText('Día de pago de comisiones'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ horasOperacionDetenida: 72, diaPagoComisiones: 5 });
  });

  it('no acepta cero horas para operación detenida', async () => {
    const onSubmit = vi.fn();
    render(<ConfiguracionGeneralForm isSubmitting={false} initialValues={initialValues} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Operación detenida después de'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Las horas para operación detenida deben ser al menos 1')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
