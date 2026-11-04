// Pasos grabados que se repiten entre tutoriales.

// Mis pendientes › Retornos por solicitar › Solicitar retorno del cliente. Devuelve el panel abierto.
export async function abrirSolicitudRetorno(h, cliente) {
  await h.click(h.page.getByRole('button', { name: 'Ver retornos por solicitar' }));
  const list = h.page.locator('#socio-pending-list');
  await list.getByRole('heading', { name: 'Retornos por solicitar' }).waitFor();
  await list.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  await h.pause(900);
  const row = list.locator('tbody tr').filter({ hasText: cliente });
  await h.moveTo(row.getByText(cliente));
  await h.pause(600);
  await h.click(row.getByRole('button', { name: 'Solicitar retorno' }));
  const drawer = h.page.getByRole('dialog', { name: 'Solicitar retorno' });
  await drawer.getByPlaceholder('1,000.00').waitFor();
  await h.pause(600);
  return drawer;
}

export async function crearSolicitud(h, drawer) {
  await h.click(drawer.getByRole('button', { name: 'Crear solicitud de retorno' }));
  await drawer.waitFor({ state: 'hidden', timeout: 30000 });
  await h.page.waitForLoadState('networkidle');
  await h.pause(800);
}
