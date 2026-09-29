import { formatMoney } from '@/modules/corte/utils/money';
import type { AccountAvailability } from '../hooks/use-account-availability';

/** Saldo, efectivo en tránsito y disponible de la cuenta elegida; avisa si el monto no alcanza. */
export function AvailabilityHint({ availability, amount }: { availability: AccountAvailability; amount: number | null }) {
  if (availability.isLoading) return <p className="text-xs text-slate-500">Consultando saldo…</p>;
  if (availability.disponible === null || availability.saldo === null) return null;
  const insufficient = amount !== null && Math.round(amount * 100) > Math.round(availability.disponible * 100);

  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-xs ${insufficient ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600'}`}>
      <p>
        Saldo {formatMoney(availability.saldo)}
        {availability.enTransito > 0 ? <> · En tránsito a Caja General {formatMoney(availability.enTransito)}</> : null}
        {' · '}<strong className="font-semibold">Disponible {formatMoney(availability.disponible)}</strong>
      </p>
      {insufficient ? <p role="alert" className="mt-1 font-semibold">Saldo insuficiente: la cuenta no puede quedar en negativo.</p> : null}
    </div>
  );
}
