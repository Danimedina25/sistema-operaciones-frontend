// Tutorial 03c · guion en tutoriales/guiones/03c-retorno-retiro-sin-tarjeta.md
import { CLIENTES, CUENTAS, operacionValidada, registrarCodigoRetiro } from '../preparacion.mjs';
import { abrirSolicitudRetorno, crearSolicitud } from '../pasos.mjs';

let drawer;
let operacion;

export default {
  name: 'Solicitar un retiro sin tarjeta',
  folder: '2 Socio Comercial',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    operacion = await operacionValidada(ctx, { clienteId: CLIENTES.alejandro, monto: 40000, archivo: 'transferencia-alejandro-40000.png', validacion: 'validacion-alejandro-40000.png' });
  },
  scenes: [
    {
      cover: { kicker: 'Socio Comercial', title: 'Retiro sin tarjeta', subtitle: 'Tu cliente cobra en el cajero con un código' },
      narration: ['En este tutorial vas a solicitar un retiro sin tarjeta: tu cliente cobra el dinero en un cajero con un código.'],
    },
    {
      title: 'Mis pendientes › Retornos por solicitar',
      narration: ['Desde Retornos por solicitar, presiona Solicitar retorno.'],
      async action(h) { drawer = await abrirSolicitudRetorno(h, 'Alejandro Torres'); },
    },
    {
      title: 'Solo indica el monto',
      narration: ['Escribe el monto y elige Retiro sin tarjeta. No necesitas capturar cuentas. Crea la solicitud.'],
      async action(h) {
        await h.type(drawer.getByPlaceholder('1,000.00'), '39000');
        await h.select(drawer.locator('select').first(), 'RETIRO_SIN_TARJETA');
        await crearSolicitud(h, drawer);
      },
    },
    {
      // Mientras se ve la transición, Cuentas registra el código sin grabar.
      cover: { kicker: 'Después', title: 'Cuentas genera el código', subtitle: 'La Jefa de Cuentas lo registra en el sistema' },
      narration: ['La Jefa de Cuentas genera el código en el banco y lo registra en el sistema. Te llegará una notificación.'],
      async action(h) {
        const cuentas = await h.session('cuentas@tutorial.test');
        await registrarCodigoRetiro({ page: cuentas.page, BASE_URL: h.BASE_URL }, { operacionId: operacion.id, cuentaId: CUENTAS.demo, codigo: 'DEMO-4821-7730' });
        await cuentas.close();
        await h.page.reload();
        await h.page.waitForLoadState('networkidle');
      },
    },
    {
      title: 'Comparte el código con tu cliente',
      narration: ['En el detalle de la operación verás el código y su monto. Compártelo con tu cliente para que haga el retiro.'],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Ver códigos de retiro' }).first());
        await h.page.getByText('DEMO-4821-7730').first().waitFor();
        await h.moveTo(h.page.getByText('DEMO-4821-7730').first());
      },
    },
    {
      title: 'Avisa cuando tu cliente lo cobre',
      narration: [
        'Cuando tu cliente cobre el dinero, presiona Marcar como utilizado.',
        'La Jefa de Cuentas verificará el cobro en el banco y, con las dos confirmaciones, el código queda concluido.',
      ],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Marcar como utilizado' }).first());
        const modal = h.page.getByRole('dialog', { name: 'Confirmar uso del código' });
        await modal.waitFor();
        await h.pause(1500);
        await h.click(modal.getByRole('button', { name: 'Marcar como utilizado' }));
        await modal.waitFor({ state: 'hidden' });
        await h.moveTo(h.page.getByText('Uso reportado').first());
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Confirmar la entrega en efectivo', subtitle: 'Socio Comercial' },
      narration: ['En el siguiente tutorial verás cómo confirmar que tu cliente recibió el efectivo.'],
      hold: 1200,
    },
  ],
};
