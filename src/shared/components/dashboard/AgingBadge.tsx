import { classifyAging, type AgingLevel } from '@/shared/utils/aging';
import { cn } from '@/shared/lib/cn';

interface AgingBadgeProps {
  /** Fecha efectiva del comprobante, si el backend la provee. */
  effectiveDate?: string | null;
  createdAt: string;
  className?: string;
}

const LEVEL_STYLES: Record<AgingLevel, { dot: string; text: string; bg: string; label: string }> = {
  GREEN: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'border-emerald-200 bg-emerald-50',
    label: 'Reciente',
  },
  YELLOW: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'border-amber-200 bg-amber-50',
    label: '24-48h',
  },
  RED: {
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    bg: 'border-rose-200 bg-rose-50',
    label: '+48h',
  },
};

/**
 * Semáforo visual de antigüedad para comprobantes bancarios. Usa la fecha
 * efectiva si existe, o `createdAt` como respaldo (regla centralizada en
 * `shared/utils/aging.ts`). El tooltip siempre muestra qué fecha se usó.
 */
export function AgingBadge({ effectiveDate, createdAt, className }: AgingBadgeProps) {
  const { level, dateUsed } = classifyAging(effectiveDate, createdAt);
  const styles = LEVEL_STYLES[level];

  const formattedDate = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateUsed));

  return (
    <span
      title={`Fecha usada: ${formattedDate}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium',
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      {styles.label}
    </span>
  );
}
