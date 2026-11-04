// Tutorial 14 · guion en tutoriales/guiones/14-configuracion.md
import { irAlMenu } from '../pasos.mjs';

const form = h => h.page.locator('main');

export default {
  name: 'Configuración del sistema',
  folder: '5 Gerente y Director',
  user: 'director@tutorial.test',
  backendPath: '/Users/danielrubenmedinapoot/IdeaProjects/Sistema de Operaciones',
  startPath: '/',
  scenes: [
    {
      cover: { kicker: 'Gerente y Director', title: 'Configuración del sistema', subtitle: 'Valores que puedes ajustar' },
      narration: ['En este tutorial vas a ver qué valores del sistema puedes ajustar sin tocar el código.'],
    },
    {
      title: 'Solo aplica a las operaciones nuevas',
      narration: [
        'La comisión de oficina es el porcentaje que se aplica por defecto a cada operación nueva.',
        'Las operaciones ya creadas conservan el suyo.',
      ],
      async action(h) {
        await irAlMenu(h, 'Administración', 'Configuración');
        const percent = form(h).getByLabel('Porcentaje de comisión de oficina');
        await h.moveTo(percent);
        await percent.fill('');
        await percent.pressSequentially('1.75', { delay: 150 });
        await h.moveTo(form(h).getByText(/Antes:/));
        await h.line(1);
        await h.moveTo(form(h).getByText(/conservan su porcentaje/));
      },
    },
    {
      title: 'Cuándo un pendiente se pone en ámbar y en rojo',
      narration: [
        'El semáforo marca los pendientes en ámbar cuando llevan varias horas sin atenderse, y en rojo cuando ya son urgentes.',
        'Aplica igual a todos los perfiles.',
      ],
      async action(h) {
        await h.moveTo(form(h).getByLabel(/Atender pronto desde/));
        await h.pause(1500);
        await h.moveTo(form(h).getByLabel(/Urgente desde/));
      },
    },
    {
      title: 'Cuándo se detiene una operación y qué día se paga',
      narration: ['Aquí defines cuántas horas sin cambios marcan una operación como detenida y qué día se pagan las comisiones de la semana anterior.'],
      async action(h) {
        await h.moveTo(form(h).getByLabel('Operación detenida después de'));
        await h.pause(1500);
        await h.moveTo(form(h).getByLabel('Día de pago de comisiones'));
      },
    },
    {
      title: 'Guarda solo cuando estés seguro',
      narration: ['Guarda los cambios cuando estés seguro. Si te equivocaste, presiona Descartar.'],
      async action(h) {
        await form(h).getByRole('button', { name: 'Guardar cambios' }).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        await h.pause(900);
        await h.moveTo(form(h).getByRole('button', { name: 'Guardar cambios' }));
        await h.pause(900);
        await h.click(form(h).getByRole('button', { name: 'Descartar' }));
        await h.moveTo(form(h).getByLabel('Porcentaje de comisión de oficina'));
      },
    },
    {
      cover: { kicker: 'Gerente y Director', title: 'Terminaste los tutoriales', subtitle: 'Sistema de operaciones' },
      narration: ['Con esto terminas los tutoriales del sistema.'],
      hold: 1200,
    },
  ],
};
