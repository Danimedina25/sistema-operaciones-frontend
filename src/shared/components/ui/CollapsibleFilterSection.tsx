import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleFilterSectionProps {
  children: ReactNode;
  title?: string;
  storageKey?: string;
}

export function CollapsibleFilterSection({
  children,
  title = 'Filtros de búsqueda',
  storageKey,
}: CollapsibleFilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return storageKey ? window.sessionStorage.getItem(storageKey) === 'true' : false;
    } catch {
      return false;
    }
  });
  const contentId = useId();

  function toggleExpanded() {
    const next = !isExpanded;
    setIsExpanded(next);
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, String(next));
    } catch {
      // El botón sigue funcionando si el navegador bloquea el almacenamiento.
    }
  }

  return (
    <section className="min-w-0 max-w-full rounded-2xl bg-white p-4 shadow-sm">
      <div className={`flex items-center justify-between gap-3 ${isExpanded ? 'mb-5' : ''}`}>
        <h2 className="min-w-0 text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isExpanded ? 'Ocultar' : 'Mostrar'}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isExpanded ? <div id={contentId} className="min-w-0 max-w-full">{children}</div> : null}
    </section>
  );
}
