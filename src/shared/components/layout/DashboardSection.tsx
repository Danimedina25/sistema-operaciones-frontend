import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Contenedor estándar para agrupar widgets de dashboard (título + grid
 * responsive). Sigue el mismo estilo de tarjeta usado en el resto del
 * sistema (`rounded-2xl bg-white p-4 shadow-sm`).
 */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: DashboardSectionProps) {
  const hasContent = children !== null && children !== undefined && children !== false;

  return (
    <section className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-5', className)}>
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          hasContent && 'mb-4',
        )}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>

      {hasContent ? <div className={contentClassName}>{children}</div> : null}
    </section>
  );
}
