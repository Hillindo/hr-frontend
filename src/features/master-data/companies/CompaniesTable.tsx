'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompanyResponse } from '@/lib/api/master-data';
import { MoreHorizontal, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

interface CompaniesTableProps {
  data: CompanyResponse[];
  loading?: boolean;
  onEdit: (company: CompanyResponse) => void;
  onToggleStatus: (company: CompanyResponse) => void;
}

export function CompaniesTable({ data, loading, onEdit, onToggleStatus }: CompaniesTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      width: 'w-48',
      render: (row: CompanyResponse) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: false,
      render: (row: CompanyResponse) => (
        <span className="text-[var(--color-text-secondary)] line-clamp-1">
          {row.description || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (row: CompanyResponse) => (
        <StatusBadge status={row.status as 'ACTIVE' | 'INACTIVE'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: 'w-32',
      render: (row: CompanyResponse) => (
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
      render: (row: CompanyResponse) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            icon={MoreHorizontal}
            aria-label="Company actions"
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
                Edit Company
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
      emptyText="No companies found"
    />
  );
}