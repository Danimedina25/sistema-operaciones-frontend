import { Fragment, type ComponentType, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  kind?: 'data' | 'status' | 'actions';
  align?: 'left' | 'right';
  className?: string;
  width?: string;
}

export interface DataTableMobile<Row> {
  title: (row: Row) => ReactNode;
  subtitle?: (row: Row) => ReactNode;
  status?: (row: Row) => ReactNode;
  fields: readonly { key: string; label: string; value: (row: Row) => ReactNode }[];
  extra?: (row: Row) => ReactNode;
  actions?: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string | number;
  mobile: DataTableMobile<Row>;
  expandedRow?: (row: Row) => ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  showHeaderWhenEmpty?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  mobile,
  expandedRow,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  showHeaderWhenEmpty = false,
  isLoading = false,
  loadingLabel = 'Cargando...',
}: DataTableProps<Row>) {
  if (columns.length > 7) throw new Error('DataTable admite un máximo de 7 columnas.');
  const statusIndex = columns.findIndex((column) => column.kind === 'status');
  const actionsIndex = columns.findIndex((column) => column.kind === 'actions');
  if (statusIndex !== -1 && statusIndex < columns.length - 3) {
    throw new Error('La columna de estatus debe estar a la derecha.');
  }
  if (actionsIndex !== -1 && actionsIndex !== columns.length - 1) {
    throw new Error('La columna de acciones debe ser la última.');
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500" role="status">{loadingLabel}</div>;
  }
  if (rows.length === 0) {
    return <>
      {showHeaderWhenEmpty && <table className="w-full table-fixed text-left text-sm"><colgroup>{columns.map(column => <col key={column.key} style={column.width ? { width: column.width } : undefined} />)}</colgroup><thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><tr>{columns.map(column => <th key={column.key} scope="col" className={cn('px-3 py-3 font-semibold', column.align === 'right' && 'text-right')}>{column.header}</th>)}</tr></thead></table>}
      <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} className="rounded-t-none border-x-0 border-b-0" />
    </>;
  }

  return (
    <div className="responsive-data-table min-w-0 w-full">
      <div className="responsive-data-table__table w-full">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>{columns.map((column) => <col key={column.key} style={column.width ? { width: column.width } : undefined} />)}</colgroup>
          <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('px-3 py-3 font-semibold', column.align === 'right' && 'text-right', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expanded = expandedRow?.(row);
              return <Fragment key={getRowKey(row)}>
                <tr className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  {columns.map((column) => (
                    <td key={column.key} className={cn('min-w-0 px-3 py-3.5 align-middle text-slate-700 [overflow-wrap:anywhere]', column.align === 'right' && 'text-right', column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
                {expanded && <tr className="border-t border-slate-100 bg-slate-50"><td colSpan={columns.length} className="px-3 py-4">{expanded}</td></tr>}
              </Fragment>
            })}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-table__cards space-y-3 p-3" data-testid="data-table-mobile">
        {rows.map((row) => (
          <article key={getRowKey(row)} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-semibold text-slate-900">{mobile.title(row)}</div>
                {mobile.subtitle && <div className="mt-1 break-words text-xs text-slate-500">{mobile.subtitle(row)}</div>}
              </div>
              {mobile.status && <div className="shrink-0">{mobile.status(row)}</div>}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {mobile.fields.map((field) => (
                <div key={field.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</dt>
                  <dd className="mt-0.5 break-words text-xs font-medium text-slate-700">{field.value(row)}</dd>
                </div>
              ))}
            </dl>
            {mobile.extra && <div className="mt-3">{mobile.extra(row)}</div>}
            {mobile.actions && <div className="mt-4 flex items-center gap-2">{mobile.actions(row)}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
