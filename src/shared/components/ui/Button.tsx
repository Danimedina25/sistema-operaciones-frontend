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
        'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition',
        'bg-slate-900 text-white hover:bg-slate-800',
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