// Tutorial 06a · guion en tutoriales/guiones/06a-validar-efectivo.md
import { CLIENTES, abrirCaja, crearOperacion } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const panel = h => h.page.getByRole('dialog', { name: /Validar pago de ingreso/ });

export default {
  name: 'Validar un pago en efectivo',
  folder: '3 Jefa de Cajas',
  user: 'cajas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await abrirCaja(ctx);
    const socio = await ctx.session('socio@tutorial.test');
    await crearOperacion({ page: socio.page, BASE_URL: ctx.BASE_URL, comprobantes: ctx.comprobantes }, {
      clienteId: CLIENTES.alejandro, monto: 25000, pagos: [{ monto: 25000, tipo: 'EFECTIVO', archivo: 'recibo-efectivo-25000.png' }],
    });
    await socio.close();
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Validar un pago en efectivo', subtitle: 'Conteo y comprobante en un solo paso' },
      narration: ['En este tutorial vas a validar un pago en efectivo que entregó un cliente.'],
    },
    {
      title: 'Caja › Entradas de efectivo',
      narration: ['Los pagos por validar están en Entradas de efectivo. También los ves en Mis pendientes.'],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Entradas de efectivo');
        await h.moveTo(h.page.locator('tbody tr').first());
        await h.pause(800);
      },
    },
    {
      title: 'Revisa el monto y el comprobante',
      narration: ['Presiona Confirmar. Se abre el panel con el monto, el cliente y el comprobante que subió el Socio.'],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Confirmar' }).first());
        await panel(h).waitFor();
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(panel(h).getByText('Comprobante del socio'));
        await h.pause(1200);
      },
    },
    {
      title: 'Cuenta el efectivo y sube el comprobante',
      narration: [
        'Cuenta el efectivo por denominación: el total debe coincidir con el pago.',
        'Sube el comprobante de validación y presiona Validar ingreso. El efectivo entra a la caja en ese momento.',
      ],
      async action(h) {
        const thousands = panel(h).getByLabel('Cantidad de $1,000.00');
        await h.moveTo(thousands);
        await thousands.fill('');
        await thousands.pressSequentially('25', { delay: 120 });
        await h.pause(900);
        await h.moveTo(panel(h).getByText(/Total contado/).first());
        await h.pause(700);
        await h.line(1);
        await h.upload(panel(h).getByText('Subir comprobante').first(), panel(h).getByLabel('Comprobante de validación *'), 'validacion-caja-25000.png');
        await h.pause(2500);
        await h.click(panel(h).getByRole('button', { name: 'Validar ingreso' }));
        await panel(h).waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
      hold: 1000,
    },
    {
      title: '¿Algo no coincide? Recházalo con motivo',
      narration: ['Si el dinero no coincide con el comprobante, en el mismo panel elige Rechazar y escribe el motivo. El Socio lo verá para corregirlo.'],
      async action(h) {
        await h.moveTo(h.page.getByText(/Validad/).filter({ visible: true }).first());
        await h.pause(1500);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Validar un cheque', subtitle: 'Jefa de Cajas' },
      narration: ['En el siguiente tutorial verás cómo validar un cheque.'],
      hold: 1200,
    },
  ],
};
