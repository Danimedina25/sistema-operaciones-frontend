import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { BankAccountResponse } from '@/modules/bank-accounts/types/bank-accounts.types';
import { formatBankAccountLabel, normalizeForSearch } from '@/shared/utils/bank-account-label';
import { maskAccountNumber } from '@/shared/utils/account-formatting';

export interface BankAccountComboboxProps {
  /** Catálogo completo; el componente decide qué mostrar según `onlyActive`. */
  accounts: BankAccountResponse[];
  value: number | null;
  onChange: (bankAccountId: number | null) => void;
  /** Texto de la etiqueta visible. También es el nombre accesible del campo. */
  label: string;
  /** Nombre accesible alternativo, cuando la etiqueta visible es más larga. */
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  /** Error al cargar el catálogo. */
  loadError?: string | null;
  /** Error de validación del campo. */
  fieldError?: string;
  /** Sólo cuentas activas. Las consultas históricas pasan `false`. */
  onlyActive?: boolean;
  /** Opción vacía, para filtros donde "todas las cuentas" es válido. */
  allowEmpty?: boolean;
  emptyLabel?: string;
}

/**
 * Selector buscable de cuenta bancaria.
 *
 * Es el primer combobox accesible del proyecto: las seis implementaciones que ya existían
 * en operaciones y retornos se escribieron en línea, sin teclado ni ARIA, y se cerraban con
 * `onBlur` + `setTimeout`. Aquí se sigue el patrón combobox de WAI-ARIA y se cierra por
 * click fuera, de modo que seleccionar con el ratón nunca compite con el desenfoque.
 */
export function BankAccountCombobox({
  accounts,
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = 'Busca por titular, banco o número…',
  disabled = false,
  isLoading = false,
  loadError = null,
  fieldError,
  onlyActive = true,
  allowEmpty = false,
  emptyLabel = 'Todas las cuentas',
}: BankAccountComboboxProps) {
  const reactId = useId();
  const inputId = `bank-account-${reactId}`;
  const listboxId = `bank-account-list-${reactId}`;
  const errorId = `bank-account-error-${reactId}`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selected = useMemo(
    () => accounts.find(account => account.id === value) ?? null,
    [accounts, value],
  );

  // Las cuentas inactivas siguen siendo visibles cuando ya están seleccionadas: un
  // movimiento histórico debe poder mostrar su cuenta aunque hoy esté dada de baja.
  const selectable = useMemo(
    () => accounts.filter(account => !onlyActive || account.activo || account.id === value),
    [accounts, onlyActive, value],
  );

  const options = useMemo(() => {
    const needle = normalizeForSearch(query);
    if (!needle) return selectable;
    return selectable.filter(account =>
      normalizeForSearch(`${account.titular} ${account.banco} ${account.numeroCuenta}`).includes(needle),
    );
  }, [selectable, query]);

  const displayValue = open ? query : selected ? formatBankAccountLabel(selected) : '';

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    const option = open && activeIndex >= 0 ? optionRefs.current[activeIndex] : null;
    // jsdom no implementa scrollIntoView; el desplazamiento es una comodidad, no un requisito.
    option?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  function commit(account: BankAccountResponse | null) {
    onChange(account?.id ?? null);
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }

  function openWith(index: number) {
    setOpen(true);
    setActiveIndex(index);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openWith(0);
        else if (options.length) setActiveIndex((activeIndex + 1) % options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openWith(options.length - 1);
        else if (options.length) setActiveIndex((activeIndex - 1 + options.length) % options.length);
        break;
      case 'Home':
        if (open) { event.preventDefault(); setActiveIndex(0); }
        break;
      case 'End':
        if (open) { event.preventDefault(); setActiveIndex(options.length - 1); }
        break;
      case 'Enter':
        // Este combobox vive dentro de formularios: Enter nunca debe enviarlos.
        event.preventDefault();
        if (open && activeIndex >= 0 && options[activeIndex]) commit(options[activeIndex]);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
          setQuery('');
          setActiveIndex(-1);
        }
        break;
      case 'Backspace':
        if (!query && selected) commit(null);
        break;
      default:
        break;
    }
  }

  const describedBy = fieldError ? errorId : undefined;

  return (
    <div className="block text-sm font-medium text-slate-700">
      <label htmlFor={inputId}>{label}</label>
      <div ref={wrapperRef} className="relative mt-1">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-label={ariaLabel ?? label}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          placeholder={isLoading ? 'Cargando cuentas…' : placeholder}
          value={displayValue}
          onChange={event => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-normal text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 ${
            fieldError
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
          }`}
        />

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? label}
            onMouseDown={event => event.preventDefault()}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {allowEmpty && !query && (
              <li
                role="option"
                aria-selected={value === null}
                onClick={() => commit(null)}
                className="cursor-pointer px-3 py-2 text-sm font-normal text-slate-500 hover:bg-slate-50"
              >
                {emptyLabel}
              </li>
            )}
            {isLoading && (
              <li className="px-3 py-2 text-sm font-normal text-slate-500">Cargando cuentas…</li>
            )}
            {!isLoading && loadError && (
              <li role="alert" className="px-3 py-2 text-sm font-normal text-red-600">{loadError}</li>
            )}
            {!isLoading && !loadError && options.length === 0 && (
              <li className="px-3 py-2 text-sm font-normal text-slate-500">No se encontraron cuentas</li>
            )}
            {!isLoading && !loadError && options.map((account, index) => (
              <li
                key={account.id}
                id={optionId(index)}
                ref={element => { optionRefs.current[index] = element; }}
                role="option"
                aria-selected={account.id === value}
                onClick={() => commit(account)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`cursor-pointer px-3 py-2 text-sm font-normal ${
                  index === activeIndex ? 'bg-slate-100' : ''
                } ${account.id === value ? 'text-slate-900' : 'text-slate-700'}`}
              >
                <span className="block">{account.titular} — {account.banco}</span>
                <span className="block text-xs text-slate-500">
                  {maskAccountNumber(account.numeroCuenta)}
                  {!account.activo && <span className="ml-2 text-amber-600">inactiva</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {fieldError && <p id={errorId} role="alert" className="mt-1 text-sm font-normal text-red-600">{fieldError}</p>}
    </div>
  );
}
