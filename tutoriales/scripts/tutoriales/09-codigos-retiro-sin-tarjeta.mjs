// Tutorial 09 · guion en tutoriales/guiones/09-codigos-retiro-sin-tarjeta.md
import { CLIENTES, operacionValidada, reportarUsoDeCodigos, solicitarRetorno } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

let operacion;
const panel = h => h.page.getByRole('dialog').last();

async function abrirCodigos(h) {
  await h.click(h.page.getByRole('button', { name: 'Gestionar códigos' }).first());
  await panel(h).getByText('Códigos de esta solicitud').waitFor();
}

export default {
  name: 'Códigos de retiro sin tarjeta',
  folder: '4 Jefa de Cuentas',
  user: 'cuentas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    operacion = await operacionValidada(ctx, { clienteId: CLIENTES.alejandro, monto: 40000, archivo: 'transferencia-alejandro-40000.png', validacion: 'validacion-alejandro-40000.png' });
    await solicitarRetorno(ctx, { operacionId: operacion.id, pago: { monto: 39000, tipoPago: 'RETIRO_SIN_TARJETA' } });
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cuentas', title: 'Códigos de retiro sin tarjeta', subtitle: 'Registrar el código y verificar su cobro' },
      narration: ['En este tutorial vas a registrar un código de retiro sin tarjeta y verificar su cobro.'],
    },
    {
      title: 'Los códigos se gestionan en el detalle de la operación',
      narration: ['Los retiros sin tarjeta se gestionan en el detalle de la operación, en la pestaña Retornos.'],
      async action(h) {
        await irAlMenu(h, 'Cuentas', 'Salidas bancarias');
        await h.moveTo(h.page.getByText(/códigos de retiro sin tarjeta se gestionan/).first());
        await h.pause(1200);
        await h.page.goto(`${h.BASE_URL}/operaciones/${operacion.id}?scrollToReturns=true`);
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(h.page.getByRole('button', { name: 'Gestionar códigos' }).first());
      },
    },
    {
      title: 'Cuenta, monto y código del banco',
      narration: [
        'Genera el código en la banca en línea y regístralo: la cuenta de donde saldrá, el monto y el código.',
        'El saldo queda reservado, todavía no se descuenta, y el Socio recibe el aviso para dárselo a su cliente.',
      ],
      async action(h) {
        await abrirCodigos(h);
        await h.type(panel(h).getByPlaceholder(/Busca por titular, banco o número/), 'DEMO');
        await h.click(h.page.getByRole('option', { name: /BANCO DEMO/ }).first());
        await h.type(panel(h).getByLabel('Monto del código'), '39000');
        await h.type(panel(h).getByLabel('Código o referencia del banco'), 'DEMO-4821-7730');
        await h.line(1);
        await h.click(panel(h).getByRole('button', { name: 'Registrar y notificar al socio' }));
        await h.page.waitForLoadState('networkidle');
        await h.pause(1500);
      },
    },
    {
      cover: { kicker: 'Después', title: 'El cliente cobra el código', subtitle: 'El Socio reporta que ya se usó' },
      narration: ['El cliente cobra en el cajero y el Socio reporta que el código ya se usó.'],
      async action(h) {
        await reportarUsoDeCodigos({ session: h.session, BASE_URL: h.BASE_URL }, { operacionId: operacion.id });
        await h.page.reload();
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Confirma solo cuando el banco muestre el cargo',
      narration: [
        'Revisa en el banco que el retiro se cobró. Sube el comprobante del cargo y confirma: el monto se descuenta una sola vez.',
        'Con las dos confirmaciones, el código queda concluido.',
      ],
      async action(h) {
        await abrirCodigos(h);
        await h.moveTo(panel(h).getByText('Uso reportado').first());
        await h.pause(1000);
        await h.click(panel(h).getByRole('button', { name: 'Confirmar cobro bancario' }).first());
        await h.upload(panel(h).getByText('Comprobante del cobro bancario').first(), panel(h).getByLabel('Comprobante del cobro bancario'), 'cargo-codigo-39000.png');
        await h.click(panel(h).getByRole('button', { name: 'Confirmar y descontar del banco' }));
        await panel(h).getByText('Concluido').first().waitFor({ timeout: 30000 });
        await h.line(1);
        await h.moveTo(panel(h).getByText('Concluido').first());
      },
    },
    {
      title: '¿Venció sin usarse? Elimínalo con motivo',
      narration: ['Si el código venció o se canceló sin usarse, elimínalo con el motivo y se libera la reserva.'],
      async action(h) { await h.pause(800); },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Retirar efectivo a la Caja General', subtitle: 'Jefa de Cuentas' },
      narration: ['En el siguiente tutorial verás cómo retirar efectivo de una cuenta para la Caja General.'],
      hold: 1200,
    },
  ],
};
