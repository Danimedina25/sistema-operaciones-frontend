import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-300 focus:border-slate-900',
            'placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100',
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = 'Input';