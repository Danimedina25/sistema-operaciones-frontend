// Tutorial 13 · guion en tutoriales/guiones/13-usuarios.md
import { irAlMenu } from '../pasos.mjs';

const fila = (h, nombre) => h.page.locator('main tbody tr').filter({ hasText: nombre }).first();
const menu = async (h, nombre) => {
  await h.click(fila(h, nombre).getByRole('button').last());
  await h.pause(500);
};

export default {
  name: 'Administrar usuarios',
  folder: '5 Gerente y Director',
  user: 'director@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/',
  scenes: [
    {
      cover: { kicker: 'Director', title: 'Administrar usuarios', subtitle: 'Altas, cambios y bajas' },
      narration: ['En este tutorial vas a dar de alta a un usuario, cambiar sus datos y desactivarlo.'],
    },
    {
      title: 'Administración › Usuarios',
      narration: ['En Usuarios ves a todas las personas del sistema, su rol y si su cuenta está activa y verificada.'],
      async action(h) {
        await irAlMenu(h, 'Administración', 'Usuarios');
        await h.moveTo(fila(h, 'Patricia Ruiz').getByText('Jefa de Cajas'));
        await h.pause(900);
        await h.moveTo(fila(h, 'Patricia Ruiz').getByText(/Activo/));
      },
    },
    {
      title: 'Nombre, correo y rol',
      narration: [
        'Presiona Nuevo usuario y captura su nombre, correo, teléfono y rol.',
        'Al guardarlo, el sistema le envía un correo para que active su cuenta y elija su contraseña.',
      ],
      async action(h) {
        await h.click(h.page.getByRole('button', { name: '+ Nuevo usuario' }));
        const panel = h.page.getByRole('dialog');
        await h.type(panel.locator('input[name="nombre"]'), 'Andrea Ríos');
        await h.type(panel.locator('input[name="correo"]'), 'auxiliar2@tutorial.test');
        await h.select(panel.locator('select[name="roleId"]'), { label: 'Auxiliar de Cuentas' });
        await h.type(panel.locator('input[name="telefono"]'), '5500000107');
        await h.line(1);
        await h.click(panel.getByRole('button', { name: 'Crear usuario' }));
        await panel.waitFor({ state: 'hidden', timeout: 30000 });
        await h.page.waitForLoadState('networkidle');
        await h.moveTo(fila(h, 'Andrea Ríos').getByText('Andrea Ríos'));
      },
    },
    {
      title: 'Editar datos o correo',
      narration: ['Desde el menú de cada usuario puedes editar sus datos o cambiar su correo.'],
      async action(h) {
        await menu(h, 'Andrea Ríos');
        await h.moveTo(h.page.getByRole('button', { name: 'Editar', exact: true }).filter({ visible: true }).first());
        await h.pause(900);
        await h.moveTo(h.page.getByRole('button', { name: 'Actualizar correo', exact: true }).filter({ visible: true }).first());
        await h.pause(900);
        await h.page.keyboard.press('Escape');
      },
    },
    {
      title: 'Desactivar en lugar de borrar',
      narration: [
        'El usuario nuevo aparece inactivo hasta que active su cuenta desde el correo.',
        'Si alguien deja de trabajar en la oficina, desactívalo: ya no podrá entrar y se conserva su historial.',
        'Eliminar es definitivo y pide escribir una palabra de confirmación.',
      ],
      async action(h) {
        await h.moveTo(fila(h, 'Andrea Ríos').getByText('Inactivo', { exact: true }));
        await h.line(1);
        await menu(h, 'Diana Flores');
        await h.click(h.page.getByRole('button', { name: 'Desactivar', exact: true }).filter({ visible: true }).first());
        const confirm = h.page.getByRole('dialog').getByRole('button', { name: /Desactivar|Confirmar/ }).last();
        if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) await h.click(confirm);
        await h.page.waitForLoadState('networkidle');
        await h.pause(800);
        await h.moveTo(fila(h, 'Diana Flores').getByText('Inactivo', { exact: true }));
      },
    },
    {
      cover: { kicker: 'Siguiente tutorial', title: 'Configuración del sistema', subtitle: 'Gerente y Director' },
      narration: ['En el siguiente tutorial verás la configuración del sistema.'],
      hold: 1200,
    },
  ],
};
