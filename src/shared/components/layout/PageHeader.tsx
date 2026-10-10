import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface PageHeaderProps {
  title: string;
  /** Se conserva mientras las pantallas migran; los encabezados ya no muestran descripción. */
  description?: ReactNode;
  /** Acciones alineadas a la derecha en escritorio y apiladas debajo en móvil. */
  actions?: ReactNode;
  className?: string;
}

/** Encabezado ligero de página: título y, cuando aplican, acciones. */
export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'min-w-0',
        actions && 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-page-title font-semibold text-ink">{title}</h1>
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
