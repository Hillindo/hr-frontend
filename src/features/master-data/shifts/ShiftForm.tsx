'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ShiftResponse, CreateShiftPayload } from '@/lib/api/master-data';

// Day options for workDays checkbox group (0 = Sunday in backend)
// Display as Sunday to Saturday for clarity
const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface ShiftFormProps {
  shift?: ShiftResponse | null;
  onSubmit: (data: CreateShiftPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function ShiftForm({ shift, onSubmit, onCancel, isLoading, isPending }: ShiftFormProps) {
  const isEdit = !!shift;

  // Initialize workDays from shift data or empty array
  const initialWorkDays = shift?.workDays ?? [];
  const [selectedWorkDays, setSelectedWorkDays] = useState<number[]>(initialWorkDays);

  const handleDayToggle = useCallback((dayValue: number) => {
    setSelectedWorkDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue);
      }
      return [...prev, dayValue];
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validate at least one work day is selected
    if (selectedWorkDays.length === 0) {
      alert('Please select at least one work day');
      return;
    }

    // Parse break duration from minutes
    const breakMinutes = parseInt(formData.get('breakDuration') as string, 10) || 0;

    const payload: CreateShiftPayload = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      breakMinutes,
      workDays: selectedWorkDays,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Shift Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Shift Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={shift?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., Morning Shift"
        />
      </div>

      {/* Shift Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Shift Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={shift?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., SH001"
        />
      </div>

      {/* Time Row: Start Time and End Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startTime" className="block text-sm font-medium text-[var(--color-text-primary)]">
            Start Time <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            required
            defaultValue={shift?.startTime}
            disabled={isLoading || isPending}
            className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endTime" className="block text-sm font-medium text-[var(--color-text-primary)]">
            End Time <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            required
            defaultValue={shift?.endTime}
            disabled={isLoading || isPending}
            className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Break Duration */}
      <div className="space-y-2">
        <label htmlFor="breakDuration" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Break Duration (minutes)
        </label>
        <input
          type="number"
          id="breakDuration"
          name="breakDuration"
          min="0"
          defaultValue={shift?.breakMinutes ?? 60}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., 60"
        />
        <p className="text-xs text-[var(--color-text-muted)]">Enter break duration in minutes</p>
      </div>

      {/* Work Days - Checkbox Group */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          Work Days <span className="text-[var(--color-danger)]">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {DAY_OPTIONS.map((day) => (
            <label
              key={day.value}
              className={`
                flex items-center justify-center w-12 h-10 rounded-xl border cursor-pointer transition-all
                ${
                  selectedWorkDays.includes(day.value)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <input
                type="checkbox"
                checked={selectedWorkDays.includes(day.value)}
                onChange={() => handleDayToggle(day.value)}
                disabled={isLoading || isPending}
                className="sr-only"
              />
              <span className="text-sm font-medium">{day.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {selectedWorkDays.length === 0
            ? 'Select at least one work day'
            : `Selected: ${[...selectedWorkDays].sort((a, b) => a - b).map((d) => DAY_OPTIONS.find((opt) => opt.value === d)?.label).join(', ')}`}
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading || isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
          disabled={isLoading || isPending || selectedWorkDays.length === 0}
        >
          {isEdit ? 'Update Shift' : 'Create Shift'}
        </Button>
      </div>
    </form>
  );
}