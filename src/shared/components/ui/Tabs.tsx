import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TabOption<Value extends string> {
  value: Value;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps<Value extends string> {
  options: readonly TabOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
  variant?: 'view' | 'method';
  className?: string;
}

export function Tabs<Value extends string>({
  options,
  value,
  onChange,
  label,
  variant = 'view',
  className,
}: TabsProps<Value>) {
  if (variant === 'method' && options.length < 2) return null;
  if (options.length === 0) return null;

  return (
    <div role="tablist" aria-label={label} className={cn('flex min-w-0 flex-wrap items-center gap-1', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
              variant === 'method'
                ? cn('border-b-2', selected ? 'border-[#3b6ef5] text-[#3b6ef5]' : 'border-transparent text-slate-500 hover:text-slate-900')
                : cn('rounded-lg', selected ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'),
            )}
          >
            {option.icon}
            {option.label}
            {typeof option.count === 'number' && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', selected ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
