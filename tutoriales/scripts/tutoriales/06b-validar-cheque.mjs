// Tutorial 06b · guion en tutoriales/guiones/06b-validar-cheque.md
import { CLIENTES, abrirCaja, crearOperacion } from '../preparacion.mjs';
import { irAlMenu } from '../pasos.mjs';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
const panel = h => h.page.getByRole('dialog', { name: 'Gestionar cheque' });

export default {
  name: 'Validar un cheque',
  folder: '3 Jefa de Cajas',
  user: 'cajas@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/mis-pendientes',
  async prepare(ctx) {
    await abrirCaja(ctx);
    const socio = await ctx.session('socio@tutorial.test');
    await crearOperacion({ page: socio.page, BASE_URL: ctx.BASE_URL, comprobantes: ctx.comprobantes }, {
      clienteId: CLIENTES.miguel, monto: 45000, pagos: [{
        monto: 45000, tipo: 'CHEQUE', archivo: 'cheque-45000.png',
        cheque: { numeroCheque: '0001234', bancoEmisor: 'BANCO EJEMPLO', emisor: 'Miguel Castro', beneficiario: 'Oficina Demo SA de CV' },
      }],
    });
    await socio.close();
  },
  scenes: [
    {
      cover: { kicker: 'Jefa de Cajas', title: 'Validar un cheque', subtitle: 'Y decidir a dónde va el dinero' },
      narration: ['En este tutorial vas a validar un cheque y decidir a dónde va el dinero.'],
    },
    {
      title: 'Los cheques también entran por Caja',
      narration: ['Los cheques también los valida Caja. Están en Entradas de efectivo: presiona Confirmar.'],
      async action(h) {
        await irAlMenu(h, 'Caja', 'Entradas de efectivo');
        await h.moveTo(h.page.locator('main tbody tr').first().getByText(/Cheque/).first());
        await h.pause(600);
        await h.click(h.page.locator('main tbody').getByRole('button', { name: 'Confirmar' }).first());
        await panel(h).locator('#cheque-action').waitFor();
      },
    },
    {
      title: 'Compara el cheque con lo capturado',
      narration: ['Compara el cheque físico con lo que capturó el Socio: número, banco, emisor, beneficiario y monto.'],
      async action(h) {
        for (const text of [/Banco emisor/, /Emisor:/, /Beneficiario/]) {
          await h.moveTo(panel(h).getByText(text).first());
          await h.pause(700);
        }
        await h.moveTo(panel(h).getByText('Ver cheque'));
      },
    },
    {
      title: 'Cobrado en efectivo o depositado en una cuenta',
      narration: [
        'Indica qué pasa con el cheque.',
        'Si se cobró en efectivo, cuenta los billetes y entran a la caja.',
        'Si se deposita en una cuenta, elige la cuenta: se crea un envío que la Jefa de Cuentas confirma cuando el banco lo acredite.',
      ],
      async action(h) {
        const action = panel(h).locator('#cheque-action');
        await h.select(action, 'DEPOSITAR');
        await h.moveTo(panel(h).getByText(/Cuentas lo confirmará/).first());
        await h.pause(1200);
        await h.select(action, 'CONFIRMAR_COBRO_EFECTIVO');
        await h.moveTo(panel(h).locator('#cheque-date'));
        await panel(h).locator('#cheque-date').fill(today);
        const thousands = panel(h).getByLabel('Cantidad de $1,000.00');
        await h.moveTo(thousands);
        await thousands.fill('');
        await thousands.pressSequentially('45', { delay: 120 });
        await h.pause(600);
        await h.upload(panel(h).getByText('Arrastra o sube el comprobante').first(), panel(h).getByLabel('Comprobante *'), 'validacion-cheque-45000.png');
        await h.line(2);
        await h.click(panel(h).getByRole('button', { name: 'Validar con este conteo' }));
        // El panel sigue abierto y el cheque pasa a "Cobrado", con su historial.
        await panel(h).getByText('Cobrado', { exact: true }).waitFor({ timeout: 30000 });
      },
    },
    {
      title: 'Cheque validado',
      narration: ['Listo: el cheque queda validado y el efectivo, registrado en la caja.'],
      async action(h) {
        await h.moveTo(panel(h).getByText('Cobrado', { exact: true }));
        await h.pause(1000);
        await h.moveTo(panel(h).getByText(/Confirmar efectivo recibido/).first());
        await h.pause(1000);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Entregar un retorno en efectivo', subtitle: 'Jefa de Cajas' },
      narration: ['En el siguiente tutorial verás cómo entregar un retorno en efectivo.'],
      hold: 1200,
    },
  ],
};
