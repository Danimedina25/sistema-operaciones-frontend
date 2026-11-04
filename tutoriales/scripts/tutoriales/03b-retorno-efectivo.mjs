// Tutorial 03b · guion en tutoriales/guiones/03b-retorno-efectivo.md
import { CLIENTES, operacionValidada } from '../preparacion.mjs';
import { abrirSolicitudRetorno, crearSolicitud } from '../pasos.mjs';

let drawer;

export default {
  name: 'Solicitar un retorno en efectivo',
  folder: '2 Socio Comercial',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await operacionValidada(ctx, { clienteId: CLIENTES.sofia, monto: 30000, archivo: 'transferencia-sofia-30000.png', validacion: 'validacion-sofia-30000.png' });
  },
  scenes: [
    {
      cover: { kicker: 'Socio Comercial', title: 'Retorno en efectivo', subtitle: 'Solicitar la entrega al cliente' },
      narration: ['En este tutorial vas a solicitar que se le entregue el dinero a tu cliente en efectivo.'],
    },
    {
      title: 'Mis pendientes › Retornos por solicitar',
      narration: ['Desde Retornos por solicitar, abre la operación y presiona Solicitar retorno.'],
      async action(h) { drawer = await abrirSolicitudRetorno(h, 'Sofía Herrera'); },
    },
    {
      title: 'Hasta 3 personas pueden recoger el efectivo',
      narration: [
        'Escribe el monto y elige Efectivo.',
        'Indica quién puede recoger el dinero: hasta tres personas.',
        'Quien lo recoja deberá mostrar una identificación oficial vigente.',
      ],
      async action(h) {
        await h.type(drawer.getByPlaceholder('1,000.00'), '29250');
        await h.select(drawer.locator('select').first(), 'EFECTIVO');
        const people = drawer.getByPlaceholder('Nombre completo');
        await h.type(people.nth(0), 'Carlos Ramírez');
        await h.type(people.nth(1), 'Ana López');
        await h.moveTo(drawer.getByText(/identificación oficial vigente/));
      },
    },
    {
      title: 'Caja programa y entrega el efectivo',
      narration: ['Presiona Crear solicitud de retorno. La Jefa de Cajas programará la entrega y te avisará.'],
      async action(h) { await crearSolicitud(h, drawer); },
    },
    {
      title: 'Al final, confirma que tu cliente lo recibió',
      narration: [
        'Cuando Caja entregue el efectivo, te aparecerá en Mis pendientes, en Retornos por confirmar.',
        'Ahí confirmas que tu cliente lo recibió.',
      ],
      async action(h) {
        await h.moveTo(h.page.getByText('Solicitado', { exact: true }).filter({ visible: true }).first());
        await h.pause(2500);
        await h.moveTo(h.page.getByText('Mis pendientes', { exact: true }).filter({ visible: true }).first());
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Retiro sin tarjeta', subtitle: 'Socio Comercial' },
      narration: ['En el siguiente tutorial verás el retiro sin tarjeta.'],
      hold: 1200,
    },
  ],
};
