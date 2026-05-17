'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PositionResponse } from '@/lib/api/master-data';
import { MoreHorizontal, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

interface PositionsTableProps {
  data: PositionResponse[];
  loading?: boolean;
  onEdit: (position: PositionResponse) => void;
  onToggleStatus: (position: PositionResponse) => void;
}

export function PositionsTable({ data, loading, onEdit, onToggleStatus }: PositionsTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Position Name',
      sortable: true,
      width: 'w-48',
      render: (row: PositionResponse) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      sortable: false,
      render: (row: PositionResponse) => (
        <span className="text-[var(--color-text-secondary)]">{row.grade ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (row: PositionResponse) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: 'w-32',
      render: (row: PositionResponse) => (
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
      render: (row: PositionResponse) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            icon={MoreHorizontal}
            aria-label="Position actions"
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
                Edit Position
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(row);
                  setActionMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
              >
                {row.status === 'ACTIVE' ? (
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
      emptyText="No positions found"
    />
  );
}
