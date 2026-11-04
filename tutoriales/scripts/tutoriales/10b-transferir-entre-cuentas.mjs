// Tutorial 10b · guion en tutoriales/guiones/10b-transferir-entre-cuentas.md
import { CLIENTES, operacionValidada } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const form = h => h.page.locator('main');

export default {
  name: 'Transferir entre cuentas',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await operacionValidada(ctx, { clienteId: CLIENTES.miguel, monto: 60000, archivo: 'transferencia-miguel-60000.png', validacion: 'validacion-miguel-60000.png' });
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Transferir entre cuentas', subtitle: 'Entre cuentas de la oficina' },
      narration: ['En este tutorial vas a registrar una transferencia entre dos cuentas de la oficina.'],
    },
    {
      title: 'Origen, beneficiaria, monto y referencia',
      narration: [
        'Entra a Transferir entre cuentas. Elige la cuenta de origen y la beneficiaria, escribe el monto y la referencia.',
        'A la derecha ves los saldos de las dos cuentas.',
      ],
      async action(h) {
        await irAlMenu(h, 'Cuentas', 'Transferir entre cuentas');
        const accounts = form(h).locator('input[role="combobox"], input[placeholder*="cuenta"], input[placeholder*="Busca"]');
        await h.type(form(h).getByPlaceholder(/Busca por titular, banco o número/).first(), 'DEMO');
        await h.click(h.page.getByRole('option', { name: /BANCO DEMO/ }).first());
        await h.type(accounts.nth(1), 'EJEMPLO');
        await h.click(h.page.getByRole('option', { name: /BANCO EJEMPLO/ }).first());
        await h.type(form(h).getByPlaceholder('0.00'), '15000');
        await h.type(form(h).getByPlaceholder(/Folio SPEI/), 'DEMO20261104009001');
        await h.line(1);
        await h.moveTo(h.page.getByText('Resumen de la transferencia'));
        await h.pause(1500);
      },
    },
    {
      title: 'El total del negocio no cambia',
      narration: ['Registra la transferencia. Una cuenta baja y la otra sube; el dinero total del negocio no cambia.'],
      async action(h) {
        await h.click(form(h).getByRole('button', { name: 'Registrar transferencia' }));
        await h.page.waitForLoadState('networkidle');
        const confirm = h.page.getByRole('dialog').getByRole('button', { name: /Confirmar|Registrar/ }).first();
        if (await confirm.isVisible().catch(() => false)) await h.click(confirm);
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.getByText('Transferencias recientes'));
        await h.pause(1200);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Confirmar un envío desde Caja', subtitle: 'Jefa de Cuentas' },
      narration: ['En el siguiente tutorial verás cómo confirmar el efectivo que Caja depositó en una cuenta.'],
      hold: 1200,
    },
  ],
};
