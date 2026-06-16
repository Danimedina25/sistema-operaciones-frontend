import { cn } from "@/shared/lib/cn";

export function ReturnStatusBadge({
  status,
}: {
  status: 'SOLICITADO' | 'RETORNADO';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
        status === 'RETORNADO' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'SOLICITADO' &&
          'border-amber-200 bg-amber-50 text-amber-700',
      )}
    >
      {status === 'RETORNADO'
        ? 'Retornado'
        : 'Solicitado'}
    </span>
  );
}