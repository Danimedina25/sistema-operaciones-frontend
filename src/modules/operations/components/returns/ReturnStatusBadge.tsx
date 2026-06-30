import { cn } from "@/shared/lib/cn";

interface ReturnStatusBadgeProps {
  status: 'SOLICITADO' | 'RETORNADO';
  hasPickupScheduled?: boolean;
}

export function ReturnStatusBadge({
  status,
  hasPickupScheduled = false,
}: ReturnStatusBadgeProps) {
  const isWaitingPickup =
    status === 'SOLICITADO' && hasPickupScheduled;

  return (
    <span
      className={cn(
        `
        inline-flex
        min-w-[140px]
        items-center
        justify-center
        rounded-full
        border
        px-3
        py-1
        text-center
        text-xs
        font-semibold
        `,
        status === 'RETORNADO' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',

        isWaitingPickup &&
          'border-blue-200 bg-blue-50 text-blue-700',

        status === 'SOLICITADO' &&
          !isWaitingPickup &&
          'border-amber-200 bg-amber-50 text-amber-700',
      )}
    >
      {status === 'RETORNADO'
        ? 'Retornado'
        : isWaitingPickup
          ? 'En recolección'
          : 'Solicitado'}
    </span>
  );
}