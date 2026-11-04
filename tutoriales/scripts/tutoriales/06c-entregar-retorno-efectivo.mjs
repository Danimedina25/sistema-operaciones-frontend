// Tutorial 06c · guion en tutoriales/guiones/06c-entregar-retorno-efectivo.md
import { CLIENTES, abrirCaja, operacionValidada, solicitarRetornoEfectivo } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
const fila = h => h.page.locator('main tbody tr').filter({ hasText: 'Sofía Herrera' }).first();

async function contar(h, panel, conteo) {
  for (const [denominacion, cantidad] of conteo) {
    const input = panel.getByLabel(`Cantidad de ${denominacion}`);
    await h.moveTo(input);
    await input.fill('');
    await input.pressSequentially(cantidad, { delay: 110 });
    await h.pause(300);
  }
}

export default {
  name: 'Entregar un retorno en efectivo',
  folder: '3 Jefa de Cajas',
  user: 'cajas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await abrirCaja(ctx);
    const operacion = await operacionValidada(ctx, { clienteId: CLIENTES.sofia, monto: 30000, archivo: 'transferencia-sofia-30000.png', validacion: 'validacion-sofia-30000.png' });
    await solicitarRetornoEfectivo(ctx, { operacionId: operacion.id, monto: 29250 });
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Entregar un retorno en efectivo', subtitle: 'Programar y entregar' },
      narration: ['En este tutorial vas a programar y entregar un retorno en efectivo.'],
    },
    {
      title: 'Caja › Salidas de efectivo',
      narration: ['Los retornos en efectivo que pidieron los socios están en Salidas de efectivo.'],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Salidas de efectivo');
        await h.moveTo(fila(h).getByText('Por programar'));
      },
    },
    {
      title: 'Programa cuándo pasan por el dinero',
      narration: [
        'Programa la recolección: el monto, el día y la hora en que pasarán por el dinero,',
        'y una foto del importe ya preparado. El Socio recibe el aviso.',
      ],
      async action(h) {
        await h.click(fila(h).getByRole('button', { name: 'Programar recolección' }));
        const panel = h.page.getByRole('dialog', { name: 'Programar recolección' });
        await panel.locator('input[name="monto"]').waitFor();
        await h.type(panel.locator('input[name="monto"]'), '29250');
        await h.moveTo(panel.locator('input[name="fechaRecoleccion"]'));
        await panel.locator('input[name="fechaRecoleccion"]').fill(today);
        await h.type(panel.getByLabel('Hora', { exact: true }), '12');
        await h.type(panel.getByLabel('Minutos (00 a 59)'), '00');
        await h.select(panel.getByLabel('Periodo'), { index: 1 });
        await h.line(1);
        await h.upload(panel.getByText('Arrastra y suelta la evidencia aquí').first(), panel.locator('#evidencia-importe-preparado'), 'importe-preparado-29250.png');
        await h.click(panel.getByRole('button', { name: 'Programar recolección' }));
        await panel.waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Quién lo recibió, conteo y evidencia',
      narration: [
        'Cuando llegue la persona, pide su identificación y verifica que esté autorizada.',
        'Registra quién lo recibió, cuenta los billetes que salen y sube el acuse firmado.',
        'El efectivo sale de la caja en ese momento.',
      ],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Salidas de efectivo');
        await h.click(h.page.locator('main').getByRole('button', { name: 'Marcar entregado' }).first());
        await h.page.waitForLoadState('networkidle');
        const panel = h.page.getByRole('dialog', { name: 'Marcar efectivo como entregado' });
        await panel.getByLabel('Cantidad de $1,000.00').waitFor({ timeout: 60000 });
        await h.line(1);
        await h.select(panel.locator('select').first(), { label: 'Carlos Ramírez' });
        await contar(h, panel, [['$1,000.00', '29'], ['$200.00', '1'], ['$50.00', '1']]);
        await h.moveTo(panel.getByText('Total contado').first());
        await h.upload(panel.getByText(/Tomar o seleccionar foto/).first(), panel.getByLabel('Foto de entrega del efectivo *'), 'acuse-entrega-29250.png');
        await h.line(2);
        await h.click(panel.getByRole('button', { name: 'Sí, marcar como entregado' }));
        await panel.waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Falta la confirmación del Socio',
      narration: ['La entrega queda registrada. Cuando el Socio confirme que su cliente lo recibió, el retorno se completa.'],
      async action(h) {
        await h.moveTo(h.page.getByText(/Entregad|Parcial entregado|Confirmación parcial/).filter({ visible: true }).first());
        await h.pause(1500);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Enviar efectivo a una cuenta', subtitle: 'Jefa de Cajas' },
      narration: ['En el siguiente tutorial verás cómo enviar efectivo de la caja a una cuenta bancaria.'],
      hold: 1200,
    },
  ],
};
