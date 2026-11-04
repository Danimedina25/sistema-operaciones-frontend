// Tutorial 07 · guion en tutoriales/guiones/07-enviar-efectivo-a-cuenta.md
import { abrirCaja } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const form = h => h.page.locator('main');

export default {
  name: 'Enviar efectivo a una cuenta',
  folder: '3 Jefa de Cajas',
  user: 'cajas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  prepare: abrirCaja,
  scenes: [
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Enviar efectivo a una cuenta', subtitle: 'De la caja al banco' },
      narration: ['En este tutorial vas a enviar efectivo de la caja a una cuenta bancaria de la oficina.'],
    },
    {
      title: 'Caja › Salidas de efectivo › Envíos a cuentas',
      narration: ['Entra a Salidas de efectivo y elige Envíos a cuentas bancarias.'],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Salidas de efectivo');
        await h.click(h.page.getByRole('tab', { name: /Envíos a cuentas/ }).or(h.page.getByRole('button', { name: /Envíos a cuentas/ })).first());
        await form(h).getByPlaceholder('Busca por banco, titular o número…').waitFor();
      },
    },
    {
      title: 'Cuenta, monto, referencia, conteo y comprobante',
      narration: [
        'Elige la cuenta destino y escribe el monto.',
        'Indica cómo se depositó, la referencia o folio, y cuenta los billetes que salen.',
        'Sube el comprobante del depósito y registra el envío.',
      ],
      async action(h) {
        await h.type(form(h).getByPlaceholder('Busca por banco, titular o número…'), 'DEMO');
        await h.click(h.page.getByRole('option', { name: /BANCO DEMO/ }).first());
        await h.type(form(h).getByPlaceholder('0.00'), '50000');
        await h.moveTo(h.page.getByText('Saldo en caja al confirmarse', { exact: false }).first());
        await h.line(1);
        await h.select(form(h).locator('select').first(), { label: 'Ventanilla' });
        await h.type(form(h).getByPlaceholder('Folio del depósito'), 'EJ-778120');
        const thousands = form(h).getByLabel('Cantidad de $1,000.00');
        await h.moveTo(thousands);
        await thousands.fill('');
        await thousands.pressSequentially('50', { delay: 120 });
        await h.line(2);
        await h.upload(form(h).getByText('Subir comprobante').first(), form(h).getByLabel('Comprobante de salida'), 'ficha-deposito-50000.png');
        await h.pause(1200);
        await h.click(form(h).getByRole('button', { name: 'Registrar envío' }));
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'El dinero queda en tránsito',
      narration: ['El envío queda en tránsito. La caja baja y la cuenta sube solo cuando la Jefa de Cuentas confirma que el banco lo recibió.'],
      async action(h) {
        const recent = h.page.getByText('Envíos recientes').first();
        await recent.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
        await h.pause(900);
        await h.moveTo(h.page.getByText('En tránsito', { exact: true }).filter({ visible: true }).first());
        await h.pause(1200);
        await h.moveTo(h.page.getByText('Reservado en tránsito').first());
      },
    },
    {
      title: '¿Rechazado? Confirma la devolución con conteo',
      narration: ['Si Cuentas lo rechaza, el efectivo sigue en tránsito hasta que confirmes, con conteo, que regresó a la caja.'],
      async action(h) { await h.pause(1000); },
    },
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Terminaste los tutoriales de Cajas', subtitle: 'Siguiente: Jefa de Cuentas' },
      narration: ['Con esto terminas los tutoriales de la Jefa de Cajas.'],
      hold: 1200,
    },
  ],
};
