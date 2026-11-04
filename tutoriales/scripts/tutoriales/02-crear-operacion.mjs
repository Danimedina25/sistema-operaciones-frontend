// Tutorial 02 · guion en tutoriales/guiones/02-crear-operacion.md
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

const payment = (page, index) => page.getByRole('heading', { name: `Pago #${index + 1}` }).locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');

async function fillPayment(h, index, { amount, type, account, file }) {
  const card = payment(h.page, index);
  await h.type(card.getByPlaceholder('1,000.00'), amount);
  await h.select(card.locator('select').first(), type);
  await h.moveTo(card.locator('input[type="date"]'));
  await card.locator('input[type="date"]').fill(today);
  await h.pause(400);
  await h.type(card.getByPlaceholder('Buscar cuenta...'), account);
  await h.click(h.page.getByRole('button', { name: new RegExp(`^${account}`) }).first());
  await h.upload(card.getByText('Comprobante de ingreso'), card.locator(`#new-operation-proof-${index}`), file);
}

export default {
  name: 'Crear una operación y registrar pagos',
  folder: '2 Socio Comercial',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/',
  scenes: [
    {
      cover: { kicker: 'Socio Comercial', title: 'Crear una operación', subtitle: 'y registrar los pagos de ingreso' },
      narration: ['En este tutorial vas a aprender a crear una operación y registrar los pagos de ingreso de tu cliente.'],
    },
    {
      title: 'Operaciones › Nueva operación',
      narration: ['Desde el menú, entra a Operaciones y presiona Nueva operación.'],
      async action(h) {
        await h.click(h.page.getByRole('link', { name: 'Operaciones', exact: true }).first());
        await h.page.waitForLoadState('networkidle');
        await h.click(h.page.getByRole('button', { name: 'Nueva operación' }).first());
        await h.page.getByPlaceholder('Buscar cliente...').waitFor();
      },
    },
    {
      title: '1. Elige al cliente y el monto total',
      narration: [
        'Primero busca a tu cliente por su nombre y selecciónalo.',
        'Después escribe el monto total de la operación. El sistema le da formato automáticamente.',
      ],
      async action(h) {
        await h.type(h.page.getByPlaceholder('Buscar cliente...'), 'Alejandro');
        await h.click(h.page.getByRole('option', { name: 'Alejandro Torres' }));
        await h.pause(1200);
        await h.type(h.page.getByPlaceholder('1,000.00').first(), '150000');
      },
    },
    {
      title: '2. ¿Quién comparte la comisión?',
      narration: [
        'Si en esta operación participa otro socio, indica cuántos niveles hay y selecciónalo.',
        'Él también recibirá su comisión. Si trabajas solo, deja un nivel.',
      ],
      async action(h) {
        const levels = h.page.locator('select').filter({ has: h.page.locator('option[value="3"]') }).first();
        await h.select(levels, '2');
        const partner = h.page.locator('select').filter({ hasText: 'Jorge Navarro' }).first();
        await h.select(partner, { label: 'Jorge Navarro' });
      },
    },
    {
      title: '3. Registra cada pago con su comprobante',
      narration: [
        'Ahora registra los pagos que hizo tu cliente.',
        'Captura el monto, el tipo de pago, la fecha del comprobante y la cuenta a la que llegó el dinero.',
        'Después adjunta el comprobante. Puede ser una foto o un PDF.',
      ],
      async action(h) {
        await fillPayment(h, 0, { amount: '100000', type: 'TRANSFERENCIA', account: 'BANCO DEMO', file: 'transferencia-100000.png' });
        await h.moveTo(h.page.getByLabel('Resumen de pagos de ingreso'));
      },
    },
    {
      title: 'Una operación puede tener varios pagos',
      narration: [
        'Si el cliente pagó en partes, agrega otro pago. Cada uno puede llegar a una cuenta distinta.',
        'Fíjate en el resumen de arriba: cuando dice Monto total cubierto, ya registraste todo.',
      ],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Agregar otro pago' }));
        await fillPayment(h, 1, { amount: '50000', type: 'DEPOSITO', account: 'BANCO EJEMPLO', file: 'deposito-50000.png' });
        await h.moveTo(h.page.getByText('Monto total cubierto. No necesitas'));
      },
    },
    {
      title: 'Listo: la operación queda en validación',
      narration: ['Presiona Registrar operación. El sistema te lleva al detalle, donde ves los pagos esperando validación.'],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Registrar operación' }));
        await h.page.waitForURL(/\/operaciones\/\d+/, { timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
      },
      hold: 1000,
    },
    {
      title: 'Cajas valida efectivo y cheques · Cuentas valida transferencias y depósitos',
      narration: [
        'Ahora la Jefa de Cuentas validará estos pagos.',
        'Si un comprobante es rechazado, lo verás en Mis pendientes para corregirlo.',
        'Y si todavía te falta registrar algún pago, la operación queda como Ingreso parcial hasta que lo completes.',
      ],
      async action(h) {
        await h.page.mouse.wheel(0, 500);
        await h.pause(1500);
        await h.page.mouse.wheel(0, 400);
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Solicitar un retorno', subtitle: 'Socio Comercial' },
      narration: ['En el siguiente tutorial verás cómo solicitar el retorno a tu cliente.'],
      hold: 1200,
    },
  ],
};
