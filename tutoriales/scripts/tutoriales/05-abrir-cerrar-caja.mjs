// Tutorial 05 · guion en tutoriales/guiones/05-abrir-cerrar-caja.md
import { cierreDeAyer } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const conteo = h => h.page.locator('main');

export default {
  name: 'Abrir y cerrar la caja',
  folder: '3 Jefa de Cajas',
  user: 'cajas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  prepare: cierreDeAyer,
  scenes: [
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Abrir y cerrar la caja', subtitle: 'Conteo inicial y conteo final' },
      narration: ['En este tutorial vas a abrir la caja al empezar el día y cerrarla al terminar.'],
    },
    {
      title: 'Caja › Abrir caja',
      narration: ['Al empezar el día entra a Caja, Abrir caja. Sin caja abierta no se pueden registrar entradas ni salidas.'],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Abrir caja');
        await conteo(h).getByRole('button', { name: 'Abrir caja con este conteo' }).waitFor();
      },
    },
    {
      title: 'El conteo viene del último cierre',
      narration: [
        'El conteo inicial ya viene con lo que quedó en el último cierre.',
        'Cuenta el efectivo y compara cada denominación.',
        'Si algo no coincide, avisa a Gerencia: solo Gerencia puede ajustar el conteo de apertura. Si todo cuadra, abre la caja.',
      ],
      async action(h) {
        await h.moveTo(conteo(h).getByText(/último cierre/).first());
        await h.line(1);
        for (const label of ['Cantidad de $1,000.00', 'Cantidad de $500.00', 'Cantidad de $200.00', 'Cantidad de $100.00', 'Cantidad de $50.00']) {
          await h.moveTo(conteo(h).getByLabel(label));
          await h.pause(450);
        }
        await h.moveTo(conteo(h).getByText('El conteo cuadra exactamente'));
        await h.line(2);
        await h.pause(3500);
        await h.click(conteo(h).getByRole('button', { name: 'Abrir caja con este conteo' }));
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      cover: { kicker: 'Más tarde', title: 'Al terminar el día', subtitle: 'Cierre con conteo final' },
      narration: ['Durante el día registras entradas y salidas. Al terminar, cierras la caja.'],
    },
    {
      title: 'Si no cuadra, vuelve a contar',
      narration: [
        'El conteo final viene con lo que debería haber en caja.',
        'Si el total contado no coincide, el sistema te lo marca y te pide explicar la diferencia.',
        'Primero vuelve a contar; muchas veces es un error de captura.',
      ],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Cerrar caja');
        const fiveHundred = conteo(h).getByLabel('Cantidad de $500.00');
        await fiveHundred.waitFor();
        await h.moveTo(conteo(h).getByText(/Saldo esperado/).first());
        await h.line(1);
        await h.moveTo(fiveHundred);
        await fiveHundred.fill('');
        await fiveHundred.pressSequentially('39', { delay: 150 });
        await h.pause(600);
        await h.moveTo(conteo(h).getByText(/Dif\./).first());
        await h.line(2);
        await h.pause(1200);
        await h.moveTo(fiveHundred);
        await fiveHundred.fill('');
        await fiveHundred.pressSequentially('40', { delay: 150 });
        await h.pause(600);
        await h.moveTo(conteo(h).getByText(/cuadra/).first());
      },
    },
    {
      title: 'Caja cerrada',
      narration: ['Cuando el total cuadre, cierra la caja. Ese conteo será el inicial de mañana.'],
      async action(h) {
        await h.click(conteo(h).getByRole('button', { name: 'Cerrar caja con este conteo' }));
        await h.page.waitForLoadState('networkidle');
        await h.pause(1200);
      },
      hold: 1200,
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Validar un pago en efectivo', subtitle: 'Jefa de Cajas' },
      narration: ['En el siguiente tutorial verás cómo validar un pago en efectivo.'],
      hold: 1200,
    },
  ],
};
