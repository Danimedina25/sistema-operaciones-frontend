import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MEXICAN_BANKS, matchesBank, normalizeBankName } from '@/shared/catalogs/banks';
import { fieldControl, fieldLabel } from '@/shared/styles/ui-tokens';

interface BankComboboxProps {
  value: string;
  onChange: (bank: string) => void;
  label?: string;
  ariaLabel?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fieldError?: string;
  onBlur?: () => void;
}

/**
 * Campo de banco: sugiere el catálogo mientras se escribe, pero NO obliga a elegir de él.
 *
 * Antes cada pantalla que pedía un banco se armaba su propio desplegable a mano —siete
 * copias de la misma lógica— y tres campos de captura del banco emisor de un cheque eran
 * texto libre sin ninguna sugerencia.
 *
 * Al salir del campo el nombre se normaliza a mayúsculas. Sin eso, "Banorte" y "BANORTE"
 * son dos bancos distintos para el filtro de Cheques por cobrar.
 *
 * Sigue el patrón combobox de WAI-ARIA, como `BankAccountCombobox`: flechas para recorrer,
 * Home/End, Enter para elegir sin enviar el formulario, Escape para cerrar.
 */
export function BankCombobox({
  value,
  onChange,
  label,
  ariaLabel,
  id,
  placeholder = 'Busca o selecciona un banco',
  disabled = false,
  required = false,
  fieldError,
  onBlur,
}: BankComboboxProps) {
  const reactId = useId();
  const inputId = id ?? `bank-${reactId}`;
  const listboxId = `bank-list-${reactId}`;
  const errorId = `bank-error-${reactId}`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Se filtra con lo ya escrito: el campo es su propia caja de búsqueda.
  const options = useMemo(
    () => MEXICAN_BANKS.filter(bank => matchesBank(bank, value)),
    [value],
  );

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

  function commit(bank: string) {
    onChange(bank);
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
        // Elegir una sugerencia no debe enviar el formulario que contiene el campo.
        if (open && activeIndex >= 0 && options[activeIndex]) {
          event.preventDefault();
          commit(options[activeIndex].value);
        }
        break;
      case 'Escape':
        if (open) { event.preventDefault(); setOpen(false); setActiveIndex(-1); }
        break;
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label htmlFor={inputId} className={fieldLabel}>
          {label}{required ? ' *' : ''}
        </label>
      ) : null}

      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? errorId : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={event => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Se guarda normalizado aunque el nombre no esté en el catálogo.
          const normalized = normalizeBankName(value);
          if (normalized !== value) onChange(normalized);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        className={`${fieldControl} ${fieldError ? 'border-red-500' : ''}`}
      />

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              No se encontraron bancos. Puedes capturarlo de todos modos.
            </li>
          ) : options.map((bank, index) => (
            <li
              key={bank.value}
              id={optionId(index)}
              ref={element => { optionRefs.current[index] = element; }}
              role="option"
              aria-selected={normalizeBankName(value) === bank.value}
              onMouseDown={event => { event.preventDefault(); commit(bank.value); }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? 'bg-slate-100' : ''}`}
            >
              {bank.label}
            </li>
          ))}
        </ul>
      ) : null}

      {fieldError ? <p id={errorId} className="mt-1 text-xs text-red-600">{fieldError}</p> : null}
    </div>
  );
}
