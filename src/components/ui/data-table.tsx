'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  rowKey?: keyof T;
  rowClassName?: (row: T, rowIndex: number) => string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = 'No data found',
  onRowClick,
  selectedRows = [],
  onSelectRow,
  rowKey,
  rowClassName,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn];
      const bVal = (b as Record<string, unknown>)[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 rounded-t-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-[var(--color-border)] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-16 text-center border border-[var(--color-border)] rounded-xl bg-white">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-premium)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-[var(--color-text-muted)]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'w-full border border-[var(--color-border)] rounded-xl bg-white',
      stickyHeader ? 'overflow-auto' : 'overflow-x-auto'
    )}>
      <table className="w-full">
        <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
          <tr className="bg-[var(--color-bg)]">
            {onSelectRow && (
              <th className={cn('w-12 px-4 py-3', stickyHeader && 'sticky top-0 z-20 bg-[var(--color-bg)]')}>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--color-border)]"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:text-[var(--color-text-primary)]',
                  column.width,
                  stickyHeader && 'sticky top-0 z-20 bg-[var(--color-bg)]'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    sortColumn === column.key ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 opacity-40" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowKey ? String(row[rowKey]) : rowIndex}
              className={cn(
                'border-b border-[var(--color-border)] last:border-b-0 transition-colors',
                onRowClick && 'cursor-pointer',
                'table-row-hover',
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                rowClassName?.(row, rowIndex)
              )}
              onClick={() => onRowClick?.(row)}
            >
              {onSelectRow && (
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--color-border)]"
                    checked={selectedRows.includes(rowKey ? String(row[rowKey]) : String(rowIndex))}
                    onChange={() => onSelectRow(rowKey ? String(row[rowKey]) : String(rowIndex))}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm">
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
