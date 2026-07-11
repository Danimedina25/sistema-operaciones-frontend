import { cn } from "@/shared/lib/cn";

interface ReturnStatusBadgeProps {
  status: 'SOLICITADO' | 'EN_RECOLECCION' | 'RETORNADO';
}

export function ReturnStatusBadge({ status }: ReturnStatusBadgeProps) {
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

        status === 'EN_RECOLECCION' &&
          'border-blue-200 bg-blue-50 text-blue-700',

        status === 'SOLICITADO' &&
          'border-amber-200 bg-amber-50 text-amber-700',
      )}
    >
      {status === 'RETORNADO'
        ? 'Retornado'
        : status === 'EN_RECOLECCION'
          ? 'En recolección'
          : 'Solicitado'}
    </span>
  );
}
