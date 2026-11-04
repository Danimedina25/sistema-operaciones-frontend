// Tutorial 03a · guion en tutoriales/guiones/03a-retorno-transferencia.md
import { CLIENTES, operacionValidada } from '../preparacion.mjs';
import { abrirSolicitudRetorno, crearSolicitud } from '../pasos.mjs';

let drawer;

export default {
  name: 'Solicitar un retorno por transferencia',
  folder: '2 Socio Comercial',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await operacionValidada(ctx, { clienteId: CLIENTES.miguel, monto: 60000, archivo: 'transferencia-miguel-60000.png', validacion: 'validacion-miguel-60000.png' });
  },
  scenes: [
    {
      cover: { kicker: 'Socio Comercial', title: 'Retorno por transferencia', subtitle: 'Solicitar la devolución al cliente' },
      narration: ['En este tutorial vas a solicitar que se le devuelva el dinero a tu cliente por transferencia.'],
    },
    {
      title: 'Mis pendientes › Retornos por solicitar',
      narration: ['Cuando los pagos de tu cliente ya están validados, la operación aparece en Retornos por solicitar. Presiona Solicitar retorno.'],
      async action(h) { drawer = await abrirSolicitudRetorno(h, 'Miguel Castro'); },
    },
    {
      title: 'El monto ya viene sin comisiones',
      narration: ['Arriba ves cuánto le corresponde a tu cliente, ya sin comisiones, y cuánto falta por solicitar.'],
      async action(h) { await h.moveTo(drawer.getByText('Monto total a retornar')); },
    },
    {
      title: 'Monto, cuenta o CLABE, banco y titular',
      narration: [
        'Escribe el monto y elige Transferencia.',
        'Captura la cuenta, la CLABE o la tarjeta del cliente, el banco y el nombre del titular.',
        'El sistema reconoce si es CLABE, cuenta o tarjeta.',
      ],
      async action(h) {
        await h.type(drawer.getByPlaceholder('1,000.00'), '58500');
        await h.select(drawer.locator('select').first(), 'TRANSFERENCIA');
        await h.type(drawer.getByLabel('Cuenta, CLABE o tarjeta del pago 1'), '000000000000004011');
        const bank = drawer.getByRole('combobox', { name: 'Banco destino' });
        await h.type(bank, 'Banorte');
        await h.click(h.page.getByRole('option', { name: /Banorte/i }).first());
        await h.type(drawer.getByPlaceholder('Nombre del beneficiario'), 'Miguel Castro');
        await h.moveTo(drawer.getByText('Se guardará como CLABE interbancaria'));
      },
    },
    {
      title: '¿Varios pagos? Divídelo o súbelo desde Excel',
      narration: ['Si el cliente quiere recibirlo en varias cuentas, agrega otro pago o cárgalos todos desde un archivo de Excel.'],
      async action(h) {
        await h.moveTo(drawer.getByText(/Excel/i).first());
        await h.pause(1500);
      },
    },
    {
      title: 'La Jefa de Cuentas hará la transferencia',
      narration: ['Presiona Crear solicitud de retorno. La Jefa de Cuentas hará la transferencia y aquí podrás ver el comprobante cuando quede pagada.'],
      async action(h) {
        await crearSolicitud(h, drawer);
        await h.moveTo(h.page.getByText('Solicitado', { exact: true }).filter({ visible: true }).first());
      },
      hold: 1200,
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Retorno en efectivo', subtitle: 'Socio Comercial' },
      narration: ['En el siguiente tutorial verás cómo solicitar un retorno en efectivo.'],
      hold: 1200,
    },
  ],
};
