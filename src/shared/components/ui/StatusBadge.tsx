import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type StatusTone = 'success' | 'pending' | 'danger' | 'active' | 'request' | 'info' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  active: 'bg-blue-100 text-blue-800',
  request: 'bg-violet-100 text-violet-800',
  info: 'bg-cyan-100 text-cyan-800',
  neutral: 'bg-slate-100 text-slate-700',
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children?: ReactNode;
  className?: string;
  /** Compatibilidad con los listados que muestran Activo/Inactivo. */
  active?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  tone,
  children,
  className,
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
}: StatusBadgeProps) {
  const resolvedTone = tone ?? (active === undefined ? 'neutral' : active ? 'active' : 'neutral');
  const label = children ?? (active === undefined ? null : active ? activeLabel : inactiveLabel);

  return (
    <span className={cn('inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-tight', toneClasses[resolvedTone], className)}>
      {label}
    </span>
  );
}
