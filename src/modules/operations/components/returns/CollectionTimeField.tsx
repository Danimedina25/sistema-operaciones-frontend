import { useRef, useState } from 'react';

export function CollectionTimeField({ value = '', onChange, onBlur, disabled = false }: {
  value?: string; onChange: (value: string) => void; onBlur?: () => void; disabled?: boolean;
}) {
  const minuteInput = useRef<HTMLInputElement>(null);
  const periodSelect = useRef<HTMLSelectElement>(null);
  const initialHour = value ? Number(value.slice(0, 2)) : null;
  const [hour, setHour] = useState(initialHour === null ? '' : String(initialHour % 12 || 12).padStart(2, '0'));
  const [minute, setMinute] = useState(value.slice(3, 5));
  const [period, setPeriod] = useState(initialHour !== null && initialHour >= 12 ? 'PM' : 'AM');
  function change(h: string, m: string, p: string) {
    setHour(h); setMinute(m); setPeriod(p);
    const valid = /^\d{1,2}$/.test(h) && Number(h) >= 1 && Number(h) <= 12
      && /^\d{1,2}$/.test(m) && Number(m) <= 59;
    onChange(valid ? `${String(Number(h) % 12 + (p === 'PM' ? 12 : 0)).padStart(2, '0')}:${m.padStart(2, '0')}` : '');
  }
  const style = 'h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-2 text-center text-sm';
  return <fieldset disabled={disabled} onBlur={onBlur}>
    <legend className="mb-2 text-sm font-medium text-slate-700">Hora de recolección</legend>
    <div className="grid grid-cols-3 items-end gap-2">
      <label className="text-xs text-slate-500">Hora
        <input aria-label="Hora" className={style} inputMode="numeric" maxLength={2} placeholder="04"
          onKeyDown={event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            minuteInput.current?.focus({ preventScroll: true });
            minuteInput.current?.select();
          }}
          value={hour} onChange={event => {
            const raw = event.target.value;
            const number = Number(raw);
            if (!/^\d{0,2}$/.test(raw) || number > 12 || raw === '00') return;
            change(raw, minute, period);
          }} />
      </label>
      <label className="text-xs text-slate-500">Minutos
        <input ref={minuteInput} aria-label="Minutos (00 a 59)" className={style} inputMode="numeric" maxLength={2} placeholder="30"
          onKeyDown={event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            periodSelect.current?.focus({ preventScroll: true });
          }}
          value={minute} onChange={event => {
            const raw = event.target.value;
            if (!/^\d{0,2}$/.test(raw) || Number(raw) > 59) return;
            change(hour, raw, period);
          }} />
      </label>
      <label className="text-xs text-slate-500">Periodo
        <select ref={periodSelect} aria-label="Periodo" className={style} value={period} onChange={event => change(hour, minute, event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}>
          <option value="AM">a. m.</option><option value="PM">p. m.</option>
        </select>
      </label>
    </div>
  </fieldset>;
}
