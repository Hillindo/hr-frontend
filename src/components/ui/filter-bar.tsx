'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('bg-white border border-[var(--color-border)] rounded-2xl p-4 flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  );
}

interface FilterInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterInput({ placeholder = 'Search...', value, onChange, className }: FilterInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-10 pr-4 w-64 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
      />
    </div>
  );
}

interface FilterSelectProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function FilterSelect({ placeholder, value, onChange, options, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 px-3 pr-8 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent appearance-none cursor-pointer',
        !value && 'text-[var(--color-text-muted)]',
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236B7280' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface FilterDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDatePicker({ value, onChange, className }: FilterDatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
        className
      )}
    />
  );
}

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-info-bg)] text-[var(--color-info)] text-sm rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-blue-200 rounded-full p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

interface FilterResetProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function FilterReset({ onClick, children }: FilterResetProps) {
  return (
    <button
      onClick={onClick}
      className="h-10 px-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      {children}
    </button>
  );
}