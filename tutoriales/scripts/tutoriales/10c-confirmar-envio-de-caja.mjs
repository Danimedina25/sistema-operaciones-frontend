// Tutorial 10c · guion en tutoriales/guiones/10c-confirmar-envio-de-caja.md
import { envioDeCajaEnTransito } from '../preparacion.mjs';

export default {
  name: 'Confirmar un envío desde Caja',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  prepare: envioDeCajaEnTransito,
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Confirmar un envío desde Caja', subtitle: 'Efectivo depositado en una cuenta' },
      narration: ['En este tutorial vas a confirmar el efectivo que Caja depositó en una cuenta de la oficina.'],
    },
    {
      title: 'Mis pendientes › Envíos desde Caja',
      narration: ['Los envíos de Caja que esperan tu confirmación aparecen en Mis pendientes y en Entradas bancarias.'],
      async action(h) {
        await h.moveTo(h.page.getByText('Envíos desde Caja por confirmar').first());
        await h.pause(1200);
        await h.click(h.page.getByRole('link', { name: /Ir a Entradas › Envíos/ }).first());
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.locator('main tbody tr').first().getByText('EJ-778120'));
      },
    },
    {
      title: 'Confirma cuando el banco lo refleje',
      narration: [
        'Revisa que el depósito ya aparezca en la cuenta.',
        'Sube el comprobante del abono y confirma. En ese momento la caja baja y la cuenta sube.',
      ],
      async action(h) {
        await h.click(h.page.locator('main tbody').getByRole('button', { name: 'Confirmar' }).first());
        const panel = h.page.getByRole('dialog').last();
        await panel.waitFor();
        await h.pause(1200);
        await h.line(1);
        await h.upload(panel.getByText(/Sube|Subir|Arrastra/).first(), panel.locator('input[type="file"]').first(), 'abono-envio-50000.png');
        await h.pause(3000);
        await h.click(panel.getByRole('button', { name: /Confirmar/ }).last());
        await panel.waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
      hold: 1000,
    },
    {
      title: '¿No llegó? Recházalo con motivo',
      narration: ['Si el depósito no aparece, recházalo con el motivo. Caja confirmará la devolución del efectivo.'],
      async action(h) { await h.pause(800); },
    },
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Terminaste los tutoriales de Cuentas', subtitle: 'Siguiente: Gerente' },
      narration: ['Con esto terminas los tutoriales de la Jefa de Cuentas.'],
      hold: 1200,
    },
  ],
};
