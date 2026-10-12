/** Formatos de presentación de la oficina; no se usan para cálculos ni para enviar datos. */
const OFFICE_TIME_ZONE = 'America/Mexico_City';
const EMPTY = '—';
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

type DateInput = Date | string | null | undefined;

const officeDateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: OFFICE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const decimal = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function parseDateParts(value: DateInput): DateParts | null {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    // LocalDate y LocalDateTime de Java no incluyen zona: sus campos ya son de la oficina.
    const plain = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,9})?)?)?$/.exec(value);
    if (plain) {
      const year = Number(plain[1]);
      const month = Number(plain[2]);
      const day = Number(plain[3]);
      const hour = Number(plain[4] ?? 0);
      const minute = Number(plain[5] ?? 0);
      return validCalendarDate(year, month, day) && hour < 24 && minute < 60
        ? { year, month, day, hour, minute }
        : null;
    }

    // Los valores con Z u offset son instantes y se convierten a la zona de la oficina.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(officeDateTime.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function dateLabel({ year, month, day }: DateParts): string {
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatDate(value: DateInput): string {
  const parts = parseDateParts(value);
  return parts ? dateLabel(parts) : EMPTY;
}

export function formatDateTime(value: DateInput): string {
  const parts = parseDateParts(value);
  return parts
    ? `${dateLabel(parts)}, ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
    : EMPTY;
}

/** Tiempo transcurrido entre horas de la oficina, incluso si el backend envía LocalDateTime. */
export function formatElapsedSince(value: DateInput, now: Date = new Date()): string {
  const start = parseDateParts(value);
  const end = parseDateParts(now);
  if (!start || !end) return EMPTY;
  const toMinutes = ({ year, month, day, hour, minute }: DateParts) =>
    Date.UTC(year, month - 1, day, hour, minute) / 60_000;
  const minutes = toMinutes(end) - toMinutes(start);
  if (minutes < 0) return EMPTY;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} días`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${value < 0 ? '−' : ''}$${decimal.format(Math.abs(value))}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${percent.format(value)}%`;
}

export function formatAccount(banco: string | null | undefined, numero: string | null | undefined): string {
  const name = banco?.trim();
  const digits = numero?.replace(/\D/g, '');
  if (!name || !digits) return EMPTY;
  return `${name.toLocaleUpperCase('es-MX')} ••${digits.slice(-4)}`;
}
