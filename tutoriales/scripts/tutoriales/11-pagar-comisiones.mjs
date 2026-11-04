// Tutorial 11 · guion en tutoriales/guiones/11-pagar-comisiones.md
import { comisionesDeLaSemanaPasada } from '../preparacion.mjs';

const fila = (h, nombre) => h.page.locator('main tbody tr').filter({ hasText: nombre }).first();
const panel = h => h.page.getByRole('dialog', { name: /Pagar comisiones/ });

export default {
  name: 'Pagar las comisiones del sábado',
  folder: '5 Gerente y Director',
  user: 'gerente@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/',
  prepare: comisionesDeLaSemanaPasada,
  scenes: [
    {
      cover: { kicker: 'Gerente', title: 'Pagar las comisiones del sábado', subtitle: 'Comisiones de la semana anterior' },
      narration: ['En este tutorial vas a pagar las comisiones de los socios de la semana pasada.'],
    },
    {
      title: 'Las comisiones se pagan cada sábado',
      narration: [
        'Cada sábado se pagan las comisiones de la semana anterior, de domingo a sábado.',
        'En Inicio ves cuánto hay por pagar. Presiona Ir a Comisiones.',
      ],
      async action(h) {
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.getByText('Comisiones por pagar').first());
        await h.line(1);
        await h.click(h.page.getByRole('button', { name: /Ir a Comisiones/ }).or(h.page.getByRole('link', { name: /Ir a Comisiones/ })).first());
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Un renglón por beneficiario',
      narration: ['Ves un renglón por beneficiario con sus operaciones de la semana y lo que se le debe. Los que no tienen comisión no aparecen.'],
      async action(h) {
        await h.moveTo(h.page.getByRole('button', { name: /Semana pasada/ }));
        await h.pause(900);
        await h.moveTo(fila(h, 'Jorge Navarro').getByText('Jorge Navarro'));
        await h.pause(700);
        await h.moveTo(fila(h, 'Laura Méndez').getByText('Laura Méndez'));
      },
    },
    {
      title: 'Transfiere y registra el pago',
      narration: [
        'Revisa el detalle por operación.',
        'Copia la cuenta del socio y haz la transferencia en la banca en línea.',
        'Después elige la cuenta de donde salió el dinero, sube el comprobante y registra el pago.',
      ],
      async action(h) {
        await h.click(fila(h, 'Laura Méndez').getByRole('button', { name: 'Pagar' }));
        await panel(h).getByText('Comisiones por pagar').waitFor();
        await h.moveTo(panel(h).getByText('Miguel Castro'));
        await h.line(1);
        await h.moveTo(panel(h).getByRole('button', { name: /Copiar cuenta/ }));
        await h.line(2);
        await h.type(panel(h).getByPlaceholder(/Busca por titular, banco o número/), 'DEMO');
        await h.click(h.page.getByRole('option', { name: /BANCO DEMO/ }).first());
        await h.upload(panel(h).getByText('Subir comprobante de la transferencia').first(), panel(h).getByLabel('Comprobante de pago'), 'transferencia-comision-900.png');
        await h.pause(1000);
        await h.click(panel(h).getByRole('button', { name: 'Registrar pago' }));
        await panel(h).waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Cada pago es una salida bancaria',
      narration: ['El pago se registra como salida de la cuenta origen y aparece en Cortes y movimientos. Repite lo mismo con cada beneficiario.'],
      async action(h) {
        await h.moveTo(fila(h, 'Jorge Navarro').getByText('Jorge Navarro'));
        await h.pause(1500);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Corte general y supervisión', subtitle: 'Gerente y Director' },
      narration: ['En el siguiente tutorial verás el Corte general y la supervisión del equipo.'],
      hold: 1200,
    },
  ],
};
