'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaveTypeResponse } from '@/lib/api/master-data';
import { MoreHorizontal, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

interface LeaveTypesTableProps {
  data: LeaveTypeResponse[];
  loading?: boolean;
  onEdit: (leaveType: LeaveTypeResponse) => void;
  onToggleStatus: (leaveType: LeaveTypeResponse) => void;
}

export function LeaveTypesTable({
  data,
  loading,
  onEdit,
  onToggleStatus,
}: LeaveTypesTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Leave Type',
      sortable: true,
      width: 'w-48',
      render: (row: LeaveTypeResponse) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'maxDaysPerRequest',
      header: 'Max Days/Request',
      sortable: true,
      width: 'w-32',
      render: (row: LeaveTypeResponse) => (
        <span className="text-[var(--color-text-primary)]">
          {row.maxDaysPerRequest != null ? `${row.maxDaysPerRequest} days` : '-'}
        </span>
      ),
    },
    {
      key: 'deductBalance',
      header: 'Balance Deduction',
      sortable: true,
      width: 'w-32',
      render: (row: LeaveTypeResponse) => (
        <Badge variant={row.deductBalance ? 'success' : 'neutral'}>
          {row.deductBalance ? 'Deducts Balance' : 'No Deduction'}
        </Badge>
      ),
    },
    {
      key: 'requiresAttachment',
      header: 'Attachment',
      sortable: true,
      width: 'w-28',
      render: (row: LeaveTypeResponse) => (
        <Badge variant={row.requiresAttachment ? 'success' : 'neutral'}>
          {row.requiresAttachment ? 'Required' : 'Not Required'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (row: LeaveTypeResponse) => (
        <StatusBadge status={row.status as 'ACTIVE' | 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      render: (row: LeaveTypeResponse) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            icon={MoreHorizontal}
            aria-label="Leave type actions"
          />
          {actionMenuOpen === row.id && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                  setActionMenuOpen(null);
                }}
                className="w-full px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Leave Type
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(row);
                  setActionMenuOpen(null);
                }}
                className="w-full px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-gray-100 flex items-center gap-2"
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
      emptyText="No leave types found"
    />
  );
}
