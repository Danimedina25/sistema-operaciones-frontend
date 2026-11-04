// Tutorial 12 · guion en tutoriales/guiones/12-corte-general-y-supervision.md
import { corteConMovimiento } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const scrollTo = async (h, locator) => {
  await locator.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  await h.pause(900);
};

export default {
  name: 'Corte general y supervisión',
  folder: '5 Gerente y Director',
  user: 'gerente@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/',
  prepare: corteConMovimiento,
  scenes: [
    {
      cover: { kicker: 'Gerente y Director', title: 'Corte general y supervisión', subtitle: 'El dinero de todo el negocio' },
      narration: ['En este tutorial vas a revisar el trabajo del equipo y el dinero de todo el negocio.'],
    },
    {
      title: 'Inicio: lo que necesita tu atención',
      narration: ['En Inicio ves primero lo que te toca: las comisiones por pagar y las operaciones detenidas, que llevan demasiado tiempo sin avanzar.'],
      async action(h) {
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.getByText('Comisiones por pagar').first());
        await h.pause(1500);
        await h.moveTo(h.page.getByText('Operaciones detenidas').first());
      },
    },
    {
      title: 'Qué tiene pendiente cada área',
      narration: ['Abajo ves qué tiene pendiente cada área y qué tan atrasado va. Desde Ver detalle entras a sus listas en modo consulta.'],
      async action(h) {
        await scrollTo(h, h.page.getByText(/Supervisión del equipo/i).first());
        await h.moveTo(h.page.getByText('Caja General').first());
        await h.pause(1000);
        await h.moveTo(h.page.getByText('Envíos desde Caja a Cuentas por confirmar').first());
        await h.pause(1000);
        await h.moveTo(h.page.getByText(/Ver detalle \(solo consulta\)/).first());
      },
    },
    {
      title: 'Inicial + entradas − salidas = final',
      narration: [
        'El Corte general junta la Caja General y todas las cuentas.',
        'La tabla siempre debe cuadrar: saldo inicial, más entradas, menos salidas, igual al saldo final.',
      ],
      async action(h) {
        await irAlMenu(h, 'Dinero', 'Corte general');
        await h.moveTo(h.page.getByText(/Dinero total/i).first());
        await h.line(1);
        await scrollTo(h, h.page.getByText('Resumen del corte').first());
        for (const concepto of ['Saldo inicial', '+ Entradas', '− Salidas', '= Saldo final']) {
          await h.moveTo(h.page.getByText(concepto, { exact: true }).first());
          await h.pause(700);
        }
      },
    },
    {
      title: 'Lo que va en camino también se cuenta',
      narration: ['Aquí ves el dinero en tránsito, como un envío de Caja que el banco aún no confirma, y el saldo de cada caja y cuenta.'],
      async action(h) {
        const transit = h.page.getByText(/En tránsito/).first();
        await scrollTo(h, transit);
        await h.moveTo(transit);
        await h.pause(1500);
        await h.page.mouse.wheel(0, 500);
        await h.pause(1200);
      },
    },
    {
      title: 'Elige el día o el rango',
      narration: ['Con el selector de periodo revisas un día o un rango de fechas.'],
      async action(h) {
        await h.page.mouse.wheel(0, -4000);
        await h.pause(700);
        await h.click(h.page.getByRole('button', { name: /Este mes/ }).first());
        await h.pause(2000);
        await h.page.keyboard.press('Escape');
      },
    },
    {
      cover: { kicker: 'Gerente y Director', title: 'Terminaste los tutoriales', subtitle: 'Siguiente: Usuarios y Configuración' },
      narration: ['En los siguientes tutoriales verás los usuarios y la configuración del sistema.'],
      hold: 1200,
    },
  ],
};
