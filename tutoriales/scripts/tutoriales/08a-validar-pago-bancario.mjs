// Tutorial 08a · guion en tutoriales/guiones/08a-validar-pago-bancario.md
import { CLIENTES, CUENTAS, crearOperacion } from '../preparacion.mjs';

const panel = h => h.page.getByRole('dialog', { name: /Validar pago de ingreso/ });

export default {
  name: 'Validar un pago bancario',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    const socio = await ctx.session('socio@tutorial.test');
    await crearOperacion({ page: socio.page, BASE_URL: ctx.BASE_URL, comprobantes: ctx.comprobantes }, {
      clienteId: CLIENTES.alejandro, monto: 40000,
      pagos: [{ monto: 40000, tipo: 'TRANSFERENCIA', cuentaId: CUENTAS.demo, archivo: 'transferencia-alejandro-40000.png' }],
    });
    await socio.close();
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Validar un pago bancario', subtitle: 'Transferencias y depósitos' },
      narration: ['En este tutorial vas a validar una transferencia o un depósito que llegó a una cuenta de la oficina.'],
    },
    {
      title: 'Mis pendientes › Ingresos para validar',
      narration: ['En Mis pendientes ves cuántos pagos esperan tu validación y desde cuándo. Presiona Ir a Entradas.'],
      async action(h) {
        await h.moveTo(h.page.getByText('Ingresos de operaciones para validar').first());
        await h.pause(1500);
        await h.click(h.page.getByRole('link', { name: /Ir a Entradas › Pagos de ingreso/ }).first());
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Compara el comprobante con tu estado de cuenta',
      narration: ['Presiona Confirmar. Revisa el monto, la cuenta destino y el comprobante, y compáralos con el movimiento en tu banca en línea.'],
      async action(h) {
        await h.click(h.page.locator('main tbody').getByRole('button', { name: 'Confirmar' }).first());
        await panel(h).waitFor();
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(panel(h).getByText(/Comprobante del socio|Comprobante de ingreso/).first());
        await h.pause(1500);
      },
    },
    {
      title: 'Sube tu comprobante y valida',
      narration: [
        'Si el dinero ya está en la cuenta, sube el comprobante del abono y presiona Validar ingreso.',
        'Si no coincide, elige Rechazar y escribe el motivo para el Socio.',
      ],
      async action(h) {
        await h.upload(panel(h).getByText('Sube el movimiento del estado de cuenta').first(), panel(h).getByLabel('Comprobante de validación *'), 'validacion-alejandro-40000.png');
        await h.pause(1200);
        await h.click(panel(h).getByRole('button', { name: 'Validar ingreso' }));
        await panel(h).waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.getByText(/Validad/).filter({ visible: true }).first());
      },
      hold: 1000,
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Pagar un retorno por transferencia', subtitle: 'Jefa de Cuentas' },
      narration: ['En el siguiente tutorial verás cómo pagar un retorno por transferencia.'],
      hold: 1200,
    },
  ],
};
