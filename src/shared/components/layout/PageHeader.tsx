import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { mutedText, panelShell } from '@/shared/styles/ui-tokens';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Acciones alineadas a la derecha en escritorio y apiladas debajo en móvil. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabecera de página del sistema: tarjeta blanca, título y descripción.
 *
 * Es la forma que ya usan 16 de las 18 pantallas administrativas. El gradiente oscuro que
 * se ve en el sistema pertenece a los modales y a las vistas de detalle, no a las
 * cabeceras de listado, así que no se usa aquí.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        panelShell,
        actions && 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {description ? <p className={cn('mt-1', mutedText)}>{description}</p> : null}
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
