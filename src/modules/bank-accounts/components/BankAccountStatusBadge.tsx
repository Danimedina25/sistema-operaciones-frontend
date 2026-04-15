interface BankAccountStatusBadgeProps {
  active: boolean;
}

export function BankAccountStatusBadge({
  active,
}: BankAccountStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {active ? 'Activa' : 'Inactiva'}
    </span>
  );
}