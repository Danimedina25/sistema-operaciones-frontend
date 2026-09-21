/**
 * Clases canónicas del sistema, en un solo lugar.
 *
 * Salen de contar el uso real en la aplicación, no de inventar un estilo nuevo: el label
 * de formulario aparece 120 veces con la misma forma, la tarjeta blanca `rounded-2xl …
 * shadow-sm` es el contenedor de 16 de las 18 pantallas administrativas, y la cabecera de
 * tabla `bg-slate-100` con versalitas de 11px la comparten 21 tablas.
 *
 * La regla de radios que ordena todo: contenedor `rounded-2xl`, control grande
 * `rounded-xl` (alto `h-11`), control pequeño o aviso `rounded-lg`, píldora `rounded-full`.
 */

/** Contenedor de tarjeta o sección. El default de cualquier bloque de página. */
export const cardShell = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';

/** Tarjeta sin borde, como la usan la cabecera de página y el panel de filtros. */
export const panelShell = 'rounded-2xl bg-white p-4 shadow-sm';

/** Título de sección dentro de una página. */
export const sectionTitle = 'text-lg font-semibold text-slate-900';

/** Micro-título en versalitas que rotula un panel. */
export const microTitle = 'text-xs font-bold uppercase tracking-wide text-slate-500';

/** Texto descriptivo bajo un título. */
export const mutedText = 'text-sm text-slate-500';

// --- Formularios -----------------------------------------------------------------------

/** El patrón más repetido del repositorio (120 usos). */
export const fieldLabel = 'mb-2 block text-sm font-medium text-slate-700';

/**
 * Campo de captura. Coincide con `ui/Input` y con el foco azul que el CSS global ya aplica
 * a todo `input`/`select` dentro de `main`, para que no convivan dos anillos distintos.
 */
export const fieldControl =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100';

// --- Avisos ----------------------------------------------------------------------------
// `red` queda para error de captura y acción destructiva; `rose` para estado de datos
// negativo, que es como ya los reparte el sistema.

export const noteInfo = 'rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800';
export const noteWarning = 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800';
export const noteDanger = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700';
export const noteNeutral = 'rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600';

// --- Botones ---------------------------------------------------------------------------
// El primario es `ui/Button` (slate-900). Aquí viven las variantes que no son un botón
// sólido; todas llevan `focus-visible:ring` porque navegar con teclado no es opcional.

export const secondaryButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const dangerOutlineButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/** Botón compacto para barras de herramientas y renglones de tabla. */
export const smallOutlineButton =
  'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// --- Tablas ----------------------------------------------------------------------------

export const tableShell =
  'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5';
export const tableHeadRow =
  'text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500';
export const tableHeadCell = 'px-4 py-3 font-medium';
export const tableRow = 'border-t border-slate-200 text-sm transition-colors hover:bg-blue-50/40';
export const tableCell = 'px-4 py-4 text-slate-600';
