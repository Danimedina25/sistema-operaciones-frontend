import * as React from 'react';
import { cn } from '@/shared/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({
  className,
  children,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-all duration-200',
        'bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Procesando...' : children}
    </button>
  );
}
