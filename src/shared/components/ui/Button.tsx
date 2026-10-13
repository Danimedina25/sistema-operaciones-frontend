import * as React from 'react';
import { cn } from '@/shared/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'neutral' | 'success' | 'destructive' | 'dark';
}

const variantClasses = {
  primary: 'bg-brand text-white shadow-brand hover:bg-brand-strong',
  neutral: 'border border-border-strong bg-surface text-ink hover:bg-surface-subtle',
  success: 'bg-success text-white hover:bg-success-strong',
  destructive: 'bg-danger text-white hover:bg-danger-strong',
  dark: 'bg-slate-950 text-white hover:bg-slate-800',
} as const;

export function Button({
  className,
  children,
  isLoading = false,
  variant = 'primary',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition-colors duration-200',
        className,
        variantClasses[variant],
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Procesando...' : children}
    </button>
  );
}
