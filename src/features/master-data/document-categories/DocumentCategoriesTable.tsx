'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentCategoryResponse } from '@/lib/api/master-data';
import { MoreHorizontal, Edit2, ToggleLeft, ToggleRight, FileText } from 'lucide-react';

interface DocumentCategoriesTableProps {
  data: DocumentCategoryResponse[];
  loading?: boolean;
  onEdit: (category: DocumentCategoryResponse) => void;
  onToggleStatus: (category: DocumentCategoryResponse) => void;
}

export function DocumentCategoriesTable({ data, loading, onEdit, onToggleStatus }: DocumentCategoriesTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      width: 'w-48',
      render: (row: DocumentCategoryResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'isMandatory',
      header: 'Mandatory',
      sortable: true,
      width: 'w-24',
      render: (row: DocumentCategoryResponse) => (
        <span className={`text-sm font-medium ${row.isMandatory ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>
          {row.isMandatory ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (row: DocumentCategoryResponse) => (
        <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: 'w-32',
      render: (row: DocumentCategoryResponse) => (
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
      render: (row: DocumentCategoryResponse) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            icon={MoreHorizontal}
            aria-label="Document category actions"
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
                Edit Category
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
      emptyText="No document categories found"
    />
  );
}