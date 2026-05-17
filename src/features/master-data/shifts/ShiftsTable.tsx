'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShiftResponse } from '@/lib/api/master-data';
import { MoreHorizontal, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

// Day labels for workDays display (0 = Sunday in backend, but display as Monday-Saturday for usability)
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ShiftsTableProps {
  data: ShiftResponse[];
  loading?: boolean;
  onEdit: (shift: ShiftResponse) => void;
  onToggleStatus: (shift: ShiftResponse) => void;
}

export function ShiftsTable({ data, loading, onEdit, onToggleStatus }: ShiftsTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Helper to format time from HH:mm string
  const formatTime = (time: string) => {
    if (!time) return '-';
    // Handle HH:mm format
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return time;
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper to format workDays array to display string
  const formatWorkDays = (workDays: number[]) => {
    if (!workDays || workDays.length === 0) return '-';
    // Sort days numerically
    const sortedDays = [...workDays].sort((a, b) => a - b);
    return sortedDays.map((d) => DAY_LABELS[d] || '').join(', ');
  };

  // Helper to format break duration
  const formatBreakDuration = (minutes: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const columns = [
    {
      key: 'name',
      header: 'Shift Name',
      sortable: true,
      width: 'w-44',
      render: (row: ShiftResponse) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'startTime',
      header: 'Start Time',
      sortable: true,
      width: 'w-28',
      render: (row: ShiftResponse) => (
        <span className="text-[var(--color-text-primary)]">{formatTime(row.startTime)}</span>
      ),
    },
    {
      key: 'endTime',
      header: 'End Time',
      sortable: true,
      width: 'w-28',
      render: (row: ShiftResponse) => (
        <span className="text-[var(--color-text-primary)]">{formatTime(row.endTime)}</span>
      ),
    },
    {
      key: 'breakDuration',
      header: 'Break',
      sortable: false,
      width: 'w-24',
      render: (row: ShiftResponse) => (
        <span className="text-[var(--color-text-secondary)]">
          {formatBreakDuration(row.breakMinutes ?? 0)}
        </span>
      ),
    },
    {
      key: 'workDays',
      header: 'Work Days',
      sortable: false,
      width: 'w-44',
      render: (row: ShiftResponse) => (
        <div className="flex flex-wrap gap-1">
          {row.workDays && row.workDays.length > 0 ? (
            [...row.workDays].sort((a, b) => a - b).map((day) => (
              <Badge key={day} variant="info" className="text-xs px-1.5 py-0.5">
                {DAY_LABELS[day]}
              </Badge>
            ))
          ) : (
            <span className="text-[var(--color-text-muted)]">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (row: ShiftResponse) => (
        <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: 'w-32',
      render: (row: ShiftResponse) => (
        <span className="text-sm text-[var(--color-text-muted)]">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      render: (row: ShiftResponse) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            icon={MoreHorizontal}
            aria-label="Shift actions"
          />
          {actionMenuOpen === row.id && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-[var(--color-border)] shadow-lg py-1 w-44 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                  setActionMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Shift
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(row);
                  setActionMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
              >
                {row.isActive ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-[var(--color-success)]" />
                    Activate
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      rowKey="id"
      emptyText="No shifts found"
    />
  );
}