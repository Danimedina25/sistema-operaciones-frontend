import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface RowActionsMenuProps {
  children: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  menuClassName?: string;
  triggerDisabled?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
  openUp: boolean;
}

/**
 * Botón "Opciones" + menú desplegable posicionado vía portal, extraído de
 * la lógica casi idéntica que existía repetida en cada tabla del sistema.
 * A diferencia del original, mide el ancho real del menú tras montarlo
 * (en vez de asumir un ancho fijo) para poder acotarlo también
 * horizontalmente contra el borde de la ventana — antes solo se ajustaba
 * verticalmente (abrir hacia arriba/abajo).
 */
export function RowActionsMenu({
  children,
  triggerLabel = 'Opciones',
  triggerClassName,
  menuClassName,
  triggerDisabled = false,
}: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleClose() {
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 208;
    const menuHeight = menuRef.current?.offsetHeight ?? 160;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + margin;

    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    );

    setPosition({
      top: openUp ? rect.top - margin : rect.bottom + margin,
      left,
      openUp,
    });
    // Re-measure once the menu has actually rendered (its content, and
    // therefore its width/height, isn't known until after first paint).
  }, [isOpen, children]);

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={triggerDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
          triggerClassName,
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
        {triggerLabel}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            onClick={close}
            className={cn(
              'fixed z-[9999] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg',
              menuClassName,
            )}
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              transform: position?.openUp ? 'translateY(-100%)' : 'none',
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
