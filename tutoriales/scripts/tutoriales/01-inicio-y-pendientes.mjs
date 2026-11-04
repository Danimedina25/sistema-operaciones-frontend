// Tutorial 01 · guion en tutoriales/guiones/01-inicio-y-pendientes.md
import { CLIENTES, CUENTAS, crearOperacion, rechazarPago, validarPago } from '../preparacion.mjs';

const transferencia = (monto, archivo) => ({ monto, tipo: 'TRANSFERENCIA', cuentaId: CUENTAS.demo, archivo });

// Abre la lista del grupo y la sube al inicio de la pantalla, lejos del subtítulo.
async function openGroup(h, action, title) {
  await h.page.mouse.wheel(0, -2000);
  await h.pause(500);
  await h.click(h.page.getByRole('button', { name: action }));
  const list = h.page.locator('#socio-pending-list');
  await list.getByRole('heading', { name: title }).waitFor();
  await h.page.waitForLoadState('networkidle');
  await list.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  await h.pause(900);
  await h.moveTo(list.locator('tbody tr').first());
  await h.pause(1200);
}

export default {
  name: 'Iniciar sesión y Mis pendientes',
  folder: '1 Primeros pasos',
  user: 'socio@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  loggedOut: true,
  startPath: '/login',
  async prepare({ session, BASE_URL, comprobantes }) {
    const socio = await session('socio@tutorial.test');
    const ctx = { page: socio.page, BASE_URL, comprobantes };
    await crearOperacion(ctx, { clienteId: CLIENTES.sofia, monto: 80000, pagos: [transferencia(50000, 'transferencia-sofia-50000.png')] });
    const miguel = await crearOperacion(ctx, { clienteId: CLIENTES.miguel, monto: 60000, pagos: [transferencia(60000, 'transferencia-miguel-60000.png')] });
    const alejandro = await crearOperacion(ctx, { clienteId: CLIENTES.alejandro, monto: 40000, pagos: [transferencia(40000, 'transferencia-alejandro-40000.png')] });
    await socio.close();

    const cuentas = await session('cuentas@tutorial.test');
    const staff = { page: cuentas.page, BASE_URL, comprobantes };
    await validarPago(staff, { operacionId: miguel.id, pagoId: miguel.pagos[0], userId: 103, archivo: 'validacion-miguel-60000.png' });
    await rechazarPago(staff, { pagoId: alejandro.pagos[0], motivo: 'El monto del comprobante no coincide' });
    await cuentas.close();
  },
  scenes: [
    {
      cover: { kicker: 'Primeros pasos', title: 'Iniciar sesión y Mis pendientes', subtitle: 'Tu lista de trabajo del día' },
      narration: ['En este tutorial vas a aprender a entrar al sistema y a usar Mis pendientes, tu lista de trabajo del día.'],
    },
    {
      title: 'Entra con tu correo y contraseña',
      narration: [
        'Escribe tu correo y tu contraseña.',
        'Si es tu computadora de trabajo, marca Recordarme para no volver a escribirlos.',
        'Si olvidaste tu contraseña, usa el enlace de abajo y te llegará un correo para cambiarla.',
      ],
      async action(h) {
        await h.type(h.page.locator('input[type="email"]'), 'socio@tutorial.test');
        await h.type(h.page.locator('input[type="password"]'), h.password);
        await h.click(h.page.getByRole('checkbox'));
        await h.pause(1500);
        await h.moveTo(h.page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }));
        await h.pause(3000);
      },
    },
    {
      title: 'Mis pendientes: todo lo que requiere tu atención',
      narration: [
        'Al entrar verás tus operaciones. Para ver tu trabajo pendiente, abre Mis pendientes en el menú.',
        'Cada tarjeta es un tipo de trabajo y muestra cuántas operaciones lo necesitan.',
        'La etiqueta te dice qué tan urgente es: en tiempo, atender pronto o urgente. Cada rol ve aquí sus propios pendientes.',
      ],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: 'Entrar al sistema' }));
        await h.page.waitForURL(url => !url.pathname.startsWith('/login'));
        await h.page.waitForLoadState('networkidle');
        await h.pause(1500);
        await h.click(h.page.getByText('Mis pendientes', { exact: true }).filter({ visible: true }).first());
        await h.page.waitForLoadState('networkidle');
        await h.pause(800);
        for (const title of ['Pagos de ingreso por registrar', 'Retornos por solicitar', 'Retornos por confirmar', 'Comprobantes rechazados']) {
          await h.moveTo(h.page.getByRole('article', { name: title }));
          await h.pause(700);
        }
      },
    },
    {
      title: 'Operaciones a las que les faltan pagos',
      narration: [
        'Aquí están las operaciones a las que les falta registrar pagos de ingreso.',
        'Ves al cliente y cuánto falta. Desde aquí entras a la operación para completarla.',
      ],
      action: h => openGroup(h, 'Ver pagos por registrar', 'Pagos de ingreso por registrar'),
    },
    {
      title: 'Corrige los comprobantes rechazados',
      narration: ['Si un comprobante fue rechazado, aparece aquí. Entra a la operación, revisa el motivo y corrige el pago.'],
      action: h => openGroup(h, 'Ver comprobantes rechazados', 'Comprobantes rechazados'),
    },
    {
      title: 'Pagos validados: ya puedes pedir el retorno',
      narration: [
        'Cuando los pagos de una operación ya están validados, aparece en Retornos por solicitar.',
        'Ahí indicas cómo se le devuelve el dinero a tu cliente.',
      ],
      action: h => openGroup(h, 'Ver retornos por solicitar', 'Retornos por solicitar'),
    },
    {
      title: 'Tu menú',
      narration: [
        'En el menú también encuentras todas tus operaciones, tus clientes y socios en Mi red, y tus comisiones.',
        'La campana te avisa cuando algo cambia.',
      ],
      async action(h) {
        await h.page.mouse.wheel(0, -2000);
        for (const name of ['Operaciones', 'Mi red', 'Mis comisiones']) {
          await h.moveTo(h.page.getByText(name, { exact: true }).filter({ visible: true }).first());
          await h.pause(900);
        }
        await h.pause(1500);
        await h.moveTo(h.page.getByRole('button', { name: /^Notificaciones/ }));
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Crear una operación', subtitle: 'Socio Comercial' },
      narration: ['En el siguiente tutorial verás cómo crear una operación.'],
      hold: 1200,
    },
  ],
};
