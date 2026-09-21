import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { searchClientes } from '@/modules/clientes/api/clientes.api';
import { fieldControl, fieldLabel } from '@/shared/styles/ui-tokens';

export interface ClienteOption {
  id: number;
  label: string;
  nivelesRedComercial?: number;
}

interface ClienteComboboxProps {
  /** Clientes ya cargados en la pantalla; se buscan primero, sin ir al servidor. */
  clientes: ClienteOption[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (cliente: ClienteOption) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fieldError?: string;
  /** Encabezado del grupo que llega del catálogo completo. Lleva significado de negocio. */
  remoteGroupLabel?: string;
  remoteSearchingLabel?: string;
}

/**
 * Selector de cliente: se escribe para filtrar y se elige del catálogo.
 *
 * Busca en dos tiempos, que es lo que ya hacían por separado las pantallas de crear y
 * editar operación: primero entre los clientes que la pantalla trae cargados y, sólo si
 * ahí no hay ninguno, consulta el catálogo completo con un respiro de 300 ms para no
 * disparar una petición por tecla.
 *
 * Aquella versión duplicada era de ratón: no tenía roles ARIA ni navegación con teclado.
 * Esta sigue el patrón combobox de WAI-ARIA, igual que `BankAccountCombobox`.
 */
export function ClienteCombobox({
  clientes,
  search,
  onSearchChange,
  onSelect,
  label = 'Cliente',
  placeholder = 'Busca un cliente por nombre',
  disabled = false,
  fieldError,
  remoteGroupLabel = 'Clientes de otros socios comerciales',
  remoteSearchingLabel = 'Buscando en clientes de otros socios comerciales...',
}: ClienteComboboxProps) {
  const reactId = useId();
  const inputId = `cliente-${reactId}`;
  const listboxId = `cliente-list-${reactId}`;
  const errorId = `cliente-error-${reactId}`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [remoteResults, setRemoteResults] = useState<ClienteOption[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const local = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return clientes;
    return clientes.filter(cliente => cliente.label.toLowerCase().includes(needle));
  }, [clientes, search]);

  // Sólo se sale a buscar cuando lo cargado no alcanza: evita una consulta por tecla.
  useEffect(() => {
    const needle = search.trim();

    if (needle.length < 2 || local.length > 0) {
      setRemoteResults([]);
      setIsSearchingRemote(false);
      return;
    }

    setIsSearchingRemote(true);

    const timeoutId = setTimeout(() => {
      searchClientes(needle)
        .then(results => setRemoteResults(results.map(cliente => ({
          id: cliente.id,
          label: cliente.nombre,
          nivelesRedComercial: cliente.nivelesRedComercial,
        }))))
        .catch(() => setRemoteResults([]))
        .finally(() => setIsSearchingRemote(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, local.length]);

  const options = local.length > 0 ? local : remoteResults;
  const isRemote = local.length === 0 && remoteResults.length > 0;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    const option = open && activeIndex >= 0 ? optionRefs.current[activeIndex] : null;
    // jsdom no implementa scrollIntoView; desplazar es comodidad, no requisito.
    option?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  function commit(cliente: ClienteOption) {
    onSelect(cliente);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) { setOpen(true); setActiveIndex(0); }
        else if (options.length) setActiveIndex((activeIndex + 1) % options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) { setOpen(true); setActiveIndex(options.length - 1); }
        else if (options.length) setActiveIndex((activeIndex - 1 + options.length) % options.length);
        break;
      case 'Home':
        if (open) { event.preventDefault(); setActiveIndex(0); }
        break;
      case 'End':
        if (open) { event.preventDefault(); setActiveIndex(options.length - 1); }
        break;
      case 'Enter':
        // Elegir un cliente no debe enviar la operación que se está capturando.
        if (open && activeIndex >= 0 && options[activeIndex]) {
          event.preventDefault();
          commit(options[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) { event.preventDefault(); setOpen(false); setActiveIndex(-1); }
        break;
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label ? <label htmlFor={inputId} className={fieldLabel}>{label}</label> : null}

      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? errorId : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={search}
        onChange={event => { onSearchChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`${fieldControl} ${fieldError ? 'border-red-500' : ''}`}
      />

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {isRemote ? (
            <li aria-hidden className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {remoteGroupLabel}
            </li>
          ) : null}

          {options.length > 0 ? options.map((cliente, index) => (
            <li
              key={cliente.id}
              id={optionId(index)}
              ref={element => { optionRefs.current[index] = element; }}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={event => { event.preventDefault(); commit(cliente); }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? 'bg-slate-100' : ''}`}
            >
              {cliente.label}
            </li>
          )) : (
            <li className="px-3 py-2 text-sm text-slate-500">
              {isSearchingRemote ? remoteSearchingLabel : 'No se encontraron clientes'}
            </li>
          )}
        </ul>
      ) : null}

      {fieldError ? <p id={errorId} className="mt-1 text-xs text-red-600">{fieldError}</p> : null}
    </div>
  );
}
