import type { Denomination } from '../types/caja-general.types';

// Iconos orientativos, no reproducciones de billetes. Referencia de familias vigentes:
// https://www.banxico.org.mx/banknotes-and-coins/currently-banknotes-and-coins.html
const notes = {
  D1000: { label: '1000', color: '#64748b', background: '#e2e8f0' },
  D500: { label: '500', color: '#2563a6', background: '#dbeafe' },
  D200: { label: '200', color: '#33845b', background: '#dcfce7' },
  D100: { label: '100', color: '#b94349', background: '#ffe4e6' },
  D50: { label: '50', color: '#96549d', background: '#f3e8ff' },
  D20: { label: '20', color: '#428b79', background: '#d8f3e8' },
} as const;

export function MexicanDenominationIcon({ denomination }: { denomination: Denomination }) {
  if (denomination in notes) {
    const note = notes[denomination as keyof typeof notes];
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 88 48" className="h-12 w-[88px] shrink-0">
      <rect x="1" y="4" width="86" height="40" rx="6" fill={note.background} stroke={note.color} />
      <rect x="5" y="8" width="78" height="32" rx="3" fill="none" stroke={note.color} strokeOpacity=".35" />
      <path d="M14 10v28m4-28v28" stroke={note.color} strokeOpacity=".3" />
      <circle cx="22" cy="24" r="8" fill={note.color} fillOpacity=".12" />
      <text x="52" y="28" textAnchor="middle" fill={note.color} fontSize="18" fontWeight="700">{note.label}</text>
      <text x="52" y="37" textAnchor="middle" fill={note.color} fontSize="6" letterSpacing="1">PESOS</text>
    </svg>;
  }
  const centavos = denomination === 'D050';
  const ten = denomination === 'D10';
  const rim = ten ? '#c9a34c' : '#cbd5e1';
  const center = centavos || ten ? '#e2e8f0' : '#e4ca80';
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 88 48" className="h-12 w-[88px] shrink-0">
    <circle cx="44" cy="24" r="22" fill={rim} stroke={ten ? '#a98435' : '#94a3b8'} />
    <circle cx="44" cy="24" r="19" fill="none" stroke="#64748b" strokeOpacity=".35" strokeDasharray="1 3" />
    <circle cx="44" cy="24" r="15" fill={center} stroke={centavos ? '#94a3b8' : '#ad975d'} />
    <text x="44" y="27" textAnchor="middle" fill="#475569" fontSize="17" fontWeight="700">{centavos ? '50' : denomination.slice(1)}</text>
    <text x="44" y="35" textAnchor="middle" fill="#475569" fontSize="5" letterSpacing=".5">{centavos ? 'CENTAVOS' : 'PESOS'}</text>
  </svg>;
}
