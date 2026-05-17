'use client';

import { cn } from '@/lib/utils';
import { FilterDatePicker } from './filter-bar';
import { X, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  className?: string;
  showDayCount?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  className,
  showDayCount = true,
}: DateRangePickerProps) {
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, [startDate, endDate]);

  const handleClear = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  const hasValue = startDate || endDate;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={cn(
                'h-10 pl-10 pr-3 w-full bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
                startDate && 'border-[var(--color-accent)]'
              )}
              placeholder="Start date"
            />
          </div>
          <span className="text-[var(--color-text-muted)] text-sm shrink-0">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate || undefined}
              className={cn(
                'h-10 pl-10 pr-3 w-full bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
                endDate && 'border-[var(--color-accent)]'
              )}
              placeholder="End date"
            />
          </div>
        </div>
        {hasValue && (
          <button
            onClick={handleClear}
            className="h-10 px-3 rounded-xl hover:bg-gray-100 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center justify-center"
            aria-label="Clear dates"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDayCount && dayCount > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {dayCount} {dayCount === 1 ? 'day' : 'days'} selected
        </p>
      )}
    </div>
  );
}

// Simpler version using FilterDatePicker internally
interface SimpleDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  className?: string;
}

export function SimpleDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  className,
}: SimpleDateRangePickerProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">Start:</span>
          <FilterDatePicker
            value={startDate}
            onChange={onStartDateChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">End:</span>
          <FilterDatePicker
            value={endDate}
            onChange={onEndDateChange}
          />
        </div>
      </div>
    </div>
  );
}
