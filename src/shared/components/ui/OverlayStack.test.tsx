import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { ActionDrawer } from './ActionDrawer';
import { RowActionsMenu } from './RowActionsMenu';
import { ValidationReceiptViewerModal } from '@/modules/operations/components/ValidationReceiptViewerModal';

const layer = (name: string) => screen.getByRole('dialog', { name }).closest<HTMLElement>('[data-overlay-root]')!;
function Example({ nested = false }: { nested?: boolean }) {
 const [drawer, setDrawer] = useState(true), [confirm, setConfirm] = useState(false);
 const confirmation = <Modal open={confirm} title="Confirmar recepción" onClose={() => setConfirm(false)}><button onClick={() => setConfirm(false)}>Cancelar confirmación</button></Modal>;
 return <><ActionDrawer open={drawer} title="Recolecciones" onClose={() => setDrawer(false)}>
  <button onClick={() => setConfirm(true)}>Confirmar recepción</button>
  {nested && confirmation}
 </ActionDrawer>{!nested && confirmation}</>;
}
it.each([true, false])('la confirmación se coloca sobre el panel, conserva su foco y cierra solo la capa superior (anidado=%s)', nested => {
 document.body.style.overflow = 'auto';
 render(<Example nested={nested} />);
 const trigger = screen.getByRole('button', { name: 'Confirmar recepción' }); trigger.focus(); fireEvent.click(trigger);
 expect(Number(layer('Confirmar recepción').style.zIndex)).toBeGreaterThan(Number(layer('Recolecciones').style.zIndex));
 expect(layer('Recolecciones').inert).toBe(true);
 const confirm = screen.getByRole('dialog', { name: 'Confirmar recepción' });
 const first = within(confirm).getByRole('button', { name: 'Cerrar modal' });
 const last = within(confirm).getByRole('button', { name: 'Cancelar confirmación' });
 last.focus(); fireEvent.keyDown(last, { key: 'Tab' }); expect(first).toHaveFocus();
 fireEvent.keyDown(first, { key: 'Tab', shiftKey: true }); expect(last).toHaveFocus();
 fireEvent.keyDown(document, { key: 'Escape' });
 expect(screen.queryByRole('dialog', { name: 'Confirmar recepción' })).not.toBeInTheDocument();
 expect(trigger).toHaveFocus(); expect(layer('Recolecciones').inert).not.toBe(true);
 expect(document.body.style.overflow).toBe('hidden');
 fireEvent.keyDown(document, { key: 'Escape' });
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(document.body.style.overflow).toBe('auto');
 document.body.style.overflow = '';
});
it('monta modales fuera de contenedores transformados y asigna títulos únicos', () => {
 render(<div style={{ transform: 'translateX(0)', overflow: 'hidden' }} data-testid="container">
  <Modal open title="Primero" onClose={vi.fn()}><button>Primero</button><Modal open title="Segundo" onClose={vi.fn()}>Segundo</Modal></Modal>
 </div>);
 expect(screen.getByTestId('container').querySelector('[role="dialog"]')).toBeNull();
 expect(layer('Primero').parentElement).toBe(document.body);
 expect(Number(layer('Segundo').style.zIndex)).toBeGreaterThan(Number(layer('Primero').style.zIndex));
 expect(screen.getByRole('dialog', { name: 'Primero' }).getAttribute('aria-labelledby')).not.toBe(screen.getByRole('dialog', { name: 'Segundo' }).getAttribute('aria-labelledby'));
});
it('un panel abierto desde un modal queda al frente y no cierra su padre', () => {
 function Content() { const [open, setOpen] = useState(false); return <Modal open title="Modal padre" onClose={vi.fn()}><button onClick={() => setOpen(true)}>Abrir panel</button><ActionDrawer open={open} title="Panel hijo" onClose={() => setOpen(false)}>Detalle</ActionDrawer></Modal>; }
 render(<Content />); fireEvent.click(screen.getByRole('button', { name: 'Abrir panel' }));
 expect(Number(layer('Panel hijo').style.zIndex)).toBeGreaterThan(Number(layer('Modal padre').style.zIndex));
 fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.getByRole('dialog', { name: 'Modal padre' })).toBeInTheDocument();
 expect(screen.queryByRole('dialog', { name: 'Panel hijo' })).not.toBeInTheDocument();
});
it('el visor participa en la pila y Escape no cierra el panel inferior', () => {
 function Content() { const [open, setOpen] = useState(false); return <ActionDrawer open title="Retorno" onClose={vi.fn()}><button onClick={() => setOpen(true)}>Ver comprobante</button>{open && <ValidationReceiptViewerModal receiptUrl="https://example.com/proof.png" canReplace={false} isSaving={false} onClose={() => setOpen(false)} onReplace={vi.fn()} />}</ActionDrawer>; }
 render(<Content />); fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante' }));
 expect(Number(layer('Comprobante de validación').style.zIndex)).toBeGreaterThan(Number(layer('Retorno').style.zIndex));
 fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog', { name: 'Comprobante de validación' })).not.toBeInTheDocument();
 expect(screen.getByRole('dialog', { name: 'Retorno' })).toBeInTheDocument();
});
it('Escape cierra primero el menú de opciones y luego el panel', () => {
 const close = vi.fn(); render(<ActionDrawer open title="Pagos" onClose={close}><RowActionsMenu ariaLabel="Opciones"><button>Ver comprobante</button></RowActionsMenu></ActionDrawer>);
 fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
 expect(screen.getByRole('button', { name: 'Ver comprobante' })).toBeInTheDocument();
 fireEvent.keyDown(document, { key: 'Escape' });
 expect(screen.queryByRole('button', { name: 'Ver comprobante' })).not.toBeInTheDocument(); expect(close).not.toHaveBeenCalled();
 fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalledOnce();
});
it('libera el bloqueo del scroll al desmontar todas las ventanas, aunque no se cierren en orden', () => {
 document.body.style.overflow = 'clip';
 const view = render(<><ActionDrawer open title="Panel" onClose={vi.fn()}>Panel</ActionDrawer><Modal open title="Confirmación" onClose={vi.fn()}>Confirmación</Modal></>);
 expect(document.body.style.overflow).toBe('hidden'); view.unmount(); expect(document.body.style.overflow).toBe('clip'); document.body.style.overflow = '';
});
