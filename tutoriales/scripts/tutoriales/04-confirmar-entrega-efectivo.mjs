// Tutorial 04 · guion en tutoriales/guiones/04-confirmar-entrega-efectivo.md
import { entregaEfectivoLista } from '../preparacion.mjs';

// "Ver retornos" abre el panel lateral con las recolecciones de la solicitud.
const panel = h => h.page.getByRole('dialog', { name: 'Confirmar recepción' });

export default {
  name: 'Confirmar que el cliente recibió el efectivo',
  folder: '2 Socio Comercial',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  prepare: entregaEfectivoLista,
  scenes: [
    {
      cover: { kicker: 'Socio Comercial', title: 'Confirmar la entrega en efectivo', subtitle: 'Tu cliente ya recibió su dinero' },
      narration: ['En este tutorial vas a confirmar que tu cliente recibió el efectivo que entregó Caja.'],
    },
    {
      title: 'Mis pendientes › Retornos por confirmar',
      narration: ['Cuando Caja entrega el efectivo, la operación aparece en Retornos por confirmar. Presiona Ver retornos.'],
      async action(h) {
        await h.moveTo(h.page.getByRole('article', { name: 'Retornos por confirmar' }));
        await h.pause(800);
        await h.click(h.page.getByRole('button', { name: 'Ver retornos por confirmar' }));
        const list = h.page.locator('#socio-pending-list');
        await list.getByRole('heading', { name: 'Retornos por confirmar' }).waitFor();
        await list.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
        await h.pause(900);
        const row = list.locator('tbody tr').filter({ hasText: 'Sofía Herrera' });
        await h.click(row.getByRole('button', { name: 'Ver retornos' }));
        await h.page.waitForLoadState('networkidle');
        await panel(h).getByRole('button', { name: 'Confirmar recepción' }).waitFor();
      },
    },
    {
      title: 'Revisa quién lo recibió y la evidencia',
      narration: [
        'Aquí ves cuánto se entregó, quién lo recibió y la evidencia que registró Caja.',
        'Verifica con tu cliente que todo esté correcto.',
      ],
      async action(h) {
        await h.moveTo(panel(h).getByText('$29,250.00').last());
        await h.pause(1200);
        await h.moveTo(panel(h).getByText('Carlos Ramírez').first());
        await h.pause(1500);
        await h.moveTo(panel(h).getByRole('link').or(panel(h).getByRole('button', { name: /evidencia|comprobante/i })).first());
      },
    },
    {
      title: 'Confirma solo cuando tu cliente lo tenga',
      narration: [
        'Si tu cliente ya tiene su dinero, presiona Confirmar recepción y acepta.',
        'Si algo no coincide, no confirmes y comunícate con Caja.',
      ],
      async action(h) {
        await h.click(panel(h).getByRole('button', { name: 'Confirmar recepción' }));
        const modal = h.page.getByRole('dialog', { name: 'Confirmar recepción de la parcialidad' });
        await modal.waitFor();
        await h.pause(1800);
        await h.click(modal.getByRole('button', { name: 'Sí, la recibí' }));
        await modal.waitFor({ state: 'hidden' });
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Retorno completado',
      narration: ['Con tu confirmación y la de Caja, el retorno queda completado y sale de tus pendientes.'],
      async action(h) {
        await h.moveTo(panel(h).getByText(/Completad/).first());
        await h.pause(1200);
      },
    },
    {
      cover: { kicker: 'Socio Comercial', title: 'Terminaste los tutoriales del Socio', subtitle: 'Siguiente: Jefa de Cajas' },
      narration: ['Con esto terminas los tutoriales del Socio Comercial.'],
      hold: 1200,
    },
  ],
};
