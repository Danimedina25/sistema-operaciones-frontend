// Tutorial 10a · guion en tutoriales/guiones/10a-retiro-a-caja-general.md
import { CLIENTES, abrirCaja, operacionValidada } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const form = h => h.page.locator('main');

export default {
  name: 'Retirar efectivo a la Caja General',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await abrirCaja(ctx);
    await operacionValidada(ctx, { clienteId: CLIENTES.miguel, monto: 60000, archivo: 'transferencia-miguel-60000.png', validacion: 'validacion-miguel-60000.png' });
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Retirar efectivo a la Caja General', subtitle: 'Del banco a la caja' },
      narration: ['En este tutorial vas a retirar efectivo de una cuenta bancaria para llevarlo a la Caja General.'],
    },
    {
      title: 'Cuentas › Salidas bancarias › Retiros a caja general',
      narration: ['Entra a Salidas bancarias y elige Retiros a caja general.'],
      async action(h) {
        await irAlMenu(h, 'Cuentas', 'Salidas bancarias');
        await h.click(h.page.getByRole('tab', { name: /Retiros a caja/ }));
        await form(h).getByLabel('Forma de retiro').waitFor();
      },
    },
    {
      title: 'Cuenta, forma, monto y referencia',
      narration: ['Elige la cuenta, cómo se retiró y el monto. Agrega la referencia y registra el retiro.'],
      async action(h) {
        await h.type(form(h).getByPlaceholder(/Busca por titular, banco o número/), 'DEMO');
        await h.click(h.page.getByRole('option', { name: /BANCO DEMO/ }).first());
        await h.select(form(h).getByLabel('Forma de retiro'), { label: 'Retiro con tarjeta (TD)' });
        await h.type(form(h).getByLabel('Monto'), '20000');
        await h.type(form(h).getByLabel('Referencia'), 'RT-552031');
        await h.pause(800);
        await h.click(form(h).getByRole('button', { name: 'Registrar retiro' }));
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Queda en tránsito hasta que Caja lo confirme',
      narration: ['El retiro queda en tránsito. La cuenta baja y la caja sube cuando la Jefa de Cajas confirme que recibió el efectivo.'],
      async action(h) {
        await h.moveTo(h.page.getByText(/En tránsito|Por confirmar/).filter({ visible: true }).first());
        await h.pause(1500);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Transferir entre cuentas', subtitle: 'Jefa de Cuentas' },
      narration: ['En el siguiente tutorial verás cómo transferir entre cuentas de la oficina.'],
      hold: 1200,
    },
  ],
};
