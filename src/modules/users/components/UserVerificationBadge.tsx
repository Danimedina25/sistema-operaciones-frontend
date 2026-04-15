import { cn } from '@/shared/lib/cn';

interface UserVerificationBadgeProps {
  verified: boolean;
}

export function UserVerificationBadge({ verified }: UserVerificationBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        verified
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700',
      )}
    >
      {verified ? 'Verificado' : 'Pendiente'}
    </span>
  );
}