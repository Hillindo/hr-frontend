'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('ellipsis-start');
  }

  // Add pages in range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('ellipsis-end');
  }

  // Always show last page if more than 1 page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]', className)}>
      <p className="text-sm text-[var(--color-text-muted)]">
        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={page} className="px-2 text-[var(--color-text-muted)]">
                ...
              </span>
            );
          }

          return (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-gray-100'
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 20, 50, 100],
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-text-muted)]">Rows per page:</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-8 px-2 bg-white border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}