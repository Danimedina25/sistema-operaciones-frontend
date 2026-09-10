import { cn } from '@/shared/lib/cn';
import { STATUS_BADGE_CLASS } from '@/shared/components/ui/status-badge-styles';

interface UserVerificationBadgeProps {
  verified: boolean;
}

export function UserVerificationBadge({ verified }: UserVerificationBadgeProps) {
  return (
    <span
      className={cn(
        STATUS_BADGE_CLASS,
        verified
          ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700',
      )}
    >
      {verified ? 'Verificado' : 'Pendiente'}
    </span>
  );
}
