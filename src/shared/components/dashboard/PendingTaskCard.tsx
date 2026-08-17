import type { ComponentType } from 'react';
import { MetricCard } from '@/shared/components/dashboard/MetricCard';

interface PendingTaskCardProps {
  label: string;
  /** null = cargando. 0 se muestra explícitamente, nunca como vacío. */
  count: number | null;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  /** Resalta la tarjeta cuando hay pendientes (por ejemplo, en ámbar). */
  urgent?: boolean;
  className?: string;
}

/**
 * Variante de MetricCard especializada en contadores de pendientes.
 */
export function PendingTaskCard({
  label,
  count,
  icon,
  onClick,
  urgent = false,
  className,
}: PendingTaskCardProps) {
  const isLoading = count === null;
  const hasItems = !isLoading && count > 0;

  return (
    <MetricCard
      label={label}
      value={isLoading ? '' : count}
      isLoading={isLoading}
      icon={icon}
      onClick={onClick}
      variant={hasItems ? (urgent ? 'amber' : 'blue') : 'default'}
      helperText={!isLoading && count === 0 ? 'Sin pendientes' : undefined}
      className={className}
    />
  );
}
