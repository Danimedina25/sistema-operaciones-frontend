import { forwardRef, type ReactNode } from 'react';

export type SummaryTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red';

export interface SummaryMetric {
  label: ReactNode;
  value: ReactNode;
  tone?: SummaryTone;
}

interface FinancialSummaryCardProps {
  /** Nombre accesible de la tarjeta, p. ej. "Resumen del cheque". */
  label: string;
  /** Línea de contexto: folio, solicitud, cliente. */
  context?: ReactNode;
  /** Entre una y tres cifras principales. */
  metrics?: SummaryMetric[];
  /** Estado del conteo o del monto: verde si cuadra, ámbar si falta; `tone` lo fija (rojo si sobra). */
  status?: { text: ReactNode; ok?: boolean; tone?: 'green' | 'amber' | 'red' };
  /** Nota breve del flujo. */
  note?: ReactNode;
  /** Errores del formulario en orden de prioridad; se muestra solo el primero y los vacíos se ignoran. */
  errors?: (string | null | undefined | false)[];
  /** Avisos que no son errores (ámbar). */
  warnings?: (ReactNode | null | undefined | false)[];
  children?: ReactNode;
  testId?: string;
  className?: string;
}

const toneClasses: Record<SummaryTone, string> = {
  neutral: 'bg-slate-50 text-slate-700',
  blue: 'bg-blue-50 text-blue-800',
  green: 'bg-emerald-50 text-emerald-800',
  amber: 'bg-amber-50 text-amber-900',
  red: 'bg-red-50 text-red-700',
};

const columns = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'];

const statusClasses = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  red: 'border-red-200 bg-red-50 text-red-700',
};

/**
 * Resumen financiero fijo en la parte superior de los paneles que mueven dinero.
 * Siempre visible al desplazarse y es el único lugar donde se muestran los errores del formulario.
 */
export const FinancialSummaryCard = forwardRef<HTMLElement, FinancialSummaryCardProps>(function FinancialSummaryCard({
  label, context, metrics = [], status, note, errors = [], warnings = [], children, testId, className = '',
}, ref) {
  // Solo el primer error, en el orden de prioridad que pasa cada panel; al corregirlo aparece el siguiente.
  const messages = errors.filter((message): message is string => Boolean(message)).slice(0, 1);
  const notices = warnings.filter(Boolean);
  return (
    <section ref={ref} aria-label={label} data-testid={testId}
      // La sombra blanca superior tapa el relleno del panel para que el contenido no se asome al desplazarse.
      className={`sticky top-0 z-10 space-y-3 rounded-2xl border bg-white p-4 shadow-[0_-24px_0_0_#fff,0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] ${messages.length > 0 ? 'border-red-300' : 'border-slate-200'} ${className}`}>
      {context && <p className="text-sm text-slate-600">{context}</p>}
      {metrics.length > 0 && (
        <dl className={`grid gap-2 text-xs sm:text-sm ${columns[Math.min(metrics.length, 3)]}`}>
          {metrics.map((metric, index) => (
            <div key={index} className={`min-w-0 rounded-xl p-3 ${toneClasses[metric.tone ?? 'neutral']}`}>
              <dt>{metric.label}</dt>
              <dd className="mt-1 break-words text-base font-bold tabular-nums sm:text-lg">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {status && (
        <p aria-live="polite" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${statusClasses[status.tone ?? (status.ok ? 'green' : 'amber')]}`}>
          {status.text}
        </p>
      )}
      {note && <p className="text-xs text-slate-500">{note}</p>}
      {children}
      {notices.map((notice, index) => (
        <p key={index} role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>
      ))}
      <div aria-live="polite" className="space-y-2 empty:hidden">
        {messages.map(message => (
          <p key={message} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>
        ))}
      </div>
    </section>
  );
});
