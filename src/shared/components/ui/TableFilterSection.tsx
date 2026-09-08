import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTableCacheKey } from '@/shared/hooks/use-table-filters';
import { CollapsibleFilterSection } from './CollapsibleFilterSection';

export function TableFilterSection({ children, title }: { children: ReactNode; title?: string }) {
  const { pathname } = useLocation();
  const storageKey = useTableCacheKey(`table-filter-panel:${pathname}:${title ?? 'default'}`);
  return (
    <CollapsibleFilterSection key={storageKey} storageKey={storageKey} title={title}>
      {children}
    </CollapsibleFilterSection>
  );
}
