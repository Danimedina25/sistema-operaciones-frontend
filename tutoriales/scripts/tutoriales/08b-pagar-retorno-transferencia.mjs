// Tutorial 08b · guion en tutoriales/guiones/08b-pagar-retorno-transferencia.md
import { CLIENTES, operacionValidada, solicitarRetorno } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const panel = h => h.page.getByRole('dialog', { name: /Registrar retorno/ });

export default {
  name: 'Pagar un retorno por transferencia',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    const operacion = await operacionValidada(ctx, { clienteId: CLIENTES.miguel, monto: 60000, archivo: 'transferencia-miguel-60000.png', validacion: 'validacion-miguel-60000.png' });
    await solicitarRetorno(ctx, { operacionId: operacion.id, pago: { monto: 58500, tipoPago: 'TRANSFERENCIA', banco: 'BANORTE', titular: 'Miguel Castro', clabe: '000000000000004011' } });
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Pagar un retorno por transferencia', subtitle: 'Del banco al cliente' },
      narration: ['En este tutorial vas a pagar el retorno de un cliente por transferencia.'],
    },
    {
      title: 'Cuentas › Salidas bancarias',
      narration: ['Los retornos por pagar están en Salidas bancarias, uno por cada solicitud del Socio.'],
      async action(h) {
        await irAlMenu(h, 'Cuentas', 'Salidas bancarias');
        await h.moveTo(h.page.locator('main tbody tr').first().getByText('Miguel Castro').first());
      },
    },
    {
      title: 'Copia la CLABE para hacer la transferencia',
      narration: ['Presiona Registrar retorno. Aquí ves los datos del beneficiario: copia la CLABE con el botón y haz la transferencia desde la banca en línea.'],
      async action(h) {
        await h.click(h.page.locator('main tbody').getByRole('button', { name: 'Registrar retorno' }).first());
        await panel(h).getByRole('button', { name: 'Copiar' }).waitFor();
        await h.moveTo(panel(h).getByText('000000000000004011'));
        await h.pause(1200);
        await h.moveTo(panel(h).getByRole('button', { name: 'Copiar' }));
      },
    },
    {
      title: 'Monto, cuenta origen y comprobante',
      narration: [
        'Después registra el pago: el monto, la cuenta de donde salió el dinero y el comprobante.',
        'Si el cliente lo pidió en partes, registra cada pago por separado.',
      ],
      async action(h) {
        await h.click(panel(h).getByRole('button', { name: 'Pagar todo' }));
        await h.type(panel(h).getByPlaceholder('Buscar cuenta...'), 'DEMO');
        await h.click(panel(h).getByRole('button', { name: /BANCO DEMO/ }).or(panel(h).getByRole('option', { name: /BANCO DEMO/ })).first());
        await h.upload(panel(h).getByText('Subir comprobante de pago').first(), panel(h).locator('#comprobante-parcialidad'), 'transferencia-salida-58500.png');
        await h.line(1);
        await h.pause(1500);
        await h.click(panel(h).getByRole('button', { name: 'Registrar retorno' }));
        await panel(h).waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Retorno pagado',
      narration: ['El Socio recibe el aviso y puede ver el comprobante en la operación.'],
      async action(h) {
        await h.moveTo(h.page.getByText(/Retornad|Pagad|Completad/).filter({ visible: true }).first());
        await h.pause(1200);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Códigos de retiro sin tarjeta', subtitle: 'Jefa de Cuentas' },
      narration: ['En el siguiente tutorial verás cómo manejar los códigos de retiro sin tarjeta.'],
      hold: 1200,
    },
  ],
};
