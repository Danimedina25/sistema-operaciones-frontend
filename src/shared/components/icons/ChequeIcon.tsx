import type { SVGProps } from 'react';

/**
 * Ícono propio del módulo de cheques: el papel del cheque con la línea del
 * beneficiario, la firma y el importe. Caja General y Cuentas bancarias ya usan
 * Banknote y Landmark de lucide, así que este se dibuja aparte para que el menú
 * no repita ícono. Caja de 24x24, trazo en currentColor y esquinas redondeadas
 * como el resto de los íconos de lucide.
 */
export function ChequeIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon="cheque"
      className={className}
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9.5h6" strokeWidth={1.7} />
      <path d="M6 15.8c1-1.8 2-1.8 2.8 0 .6-1.4 1.6-1.7 2.6-1" strokeWidth={1.6} />
      <path
        d="M17.2 8.4v7.2M19 10h-2.6a1.3 1.3 0 0 0 0 2.6h1.3a1.3 1.3 0 0 1 0 2.6h-2.4"
        strokeWidth={1.5}
      />
    </svg>
  );
}
