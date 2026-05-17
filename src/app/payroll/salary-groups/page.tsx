'use client';

import { type FormEvent, useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import {
  useSalaryGroups,
  useCreateSalaryGroup,
  useUpdateSalaryGroup,
  useDeleteSalaryGroup,
} from '@/features/admin/hooks/useAdmin';
import type { SalaryGroup } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth/auth-context';
import { Plus, Edit3, Trash2 } from 'lucide-react';

const CALC_LABELS: Record<string, string> = {
  FIXED_AMOUNT: 'Fixed Amount',
  PERCENTAGE: 'Percentage (%)',
  DAILY_RATE_MULTIPLIER: 'Daily Rate × Factor',
};

function formatCurrency(value: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function SalaryGroupsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('payroll_config.manage_tenant');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = { page, pageSize: 20, search: search || undefined };

  const { data, isLoading } = useSalaryGroups(params);
  const createMutation = useCreateSalaryGroup();
  const updateMutation = useUpdateSalaryGroup();
  const deleteMutation = useDeleteSalaryGroup();

  const [editingItem, setEditingItem] = useState<SalaryGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const groups = data?.data ?? [];

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: SalaryGroup) => <span className="font-mono text-xs font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: SalaryGroup) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'baseSalary',
      header: 'Base Salary',
      render: (row: SalaryGroup) => <span className="font-semibold">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      key: 'dailyRate',
      header: 'Daily Rate',
      render: (row: SalaryGroup) => <span>{row.dailyRate > 0 ? formatCurrency(row.dailyRate) : 'Auto'}</span>,
    },
    {
      key: 'hourlyRate',
      header: 'Hourly Rate',
      render: (row: SalaryGroup) => <span>{row.hourlyRate > 0 ? formatCurrency(row.hourlyRate) : 'Auto'}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: SalaryGroup) => (
        <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: SalaryGroup) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" icon={Edit3} onClick={() => { setIsCreating(false); setEditingItem(row); }}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  onClick={async () => {
                    if (confirm(`Delete salary group "${row.code}"?`)) {
                      try {
                        await deleteMutation.mutateAsync(row.id);
                        setFeedback('Salary group deleted');
                      } catch (err) {
                        setFeedback(err instanceof Error ? err.message : 'Delete failed');
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageWrapper
      title="Salary Groups"
      subtitle="Configure base salary, daily rate, and hourly rate for each salary grade"
      actions={
        canManage ? (
          <Button
            variant="accent"
            icon={Plus}
            onClick={() => { setIsCreating(true); setEditingItem(null); }}
          >
            Add Group
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full max-w-md rounded-lg border border-[var(--color-border)] px-3 text-sm"
            />
          </div>
        </Card>

        <Card className="p-4">
          <DataTable
            columns={columns}
            data={groups}
            loading={isLoading}
            emptyText="No salary groups configured. Add one to replace the default hardcoded values."
            rowKey="id"
          />
          {data?.meta && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                Showing {groups.length} of {data.meta.total} groups
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={!data.meta.hasNext} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {feedback && (
          <p className="text-sm text-[var(--color-text-muted)]">{feedback}</p>
        )}
      </div>

      {(isCreating || editingItem) && (
        <SalaryGroupForm
          item={editingItem}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => { setEditingItem(null); setIsCreating(false); setFeedback(null); }}
          onSave={async (values) => {
            try {
              if (isCreating) {
                await createMutation.mutateAsync(values);
                setFeedback('Salary group created');
              } else if (editingItem) {
                await updateMutation.mutateAsync({ id: editingItem.id, payload: values });
                setFeedback('Salary group updated');
              }
              setEditingItem(null);
              setIsCreating(false);
            } catch (err) {
              setFeedback(err instanceof Error ? err.message : 'Save failed');
            }
          }}
        />
      )}
    </PageWrapper>
  );
}

function SalaryGroupForm({
  item,
  isSaving,
  onClose,
  onSave,
}: {
  item: SalaryGroup | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { code: string; name: string; baseSalary: number; dailyRate?: number; hourlyRate?: number; isActive?: boolean }) => Promise<void>;
}) {
  const [code, setCode] = useState(item?.code || '');
  const [name, setName] = useState(item?.name || '');
  const [baseSalary, setBaseSalary] = useState(String(item?.baseSalary || ''));
  const [dailyRate, setDailyRate] = useState(String(item?.dailyRate || ''));
  const [hourlyRate, setHourlyRate] = useState(String(item?.hourlyRate || ''));
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({
      code,
      name,
      baseSalary: Number(baseSalary || 0),
      dailyRate: dailyRate ? Number(dailyRate) : undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      isActive,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-semibold text-[var(--color-text-primary)]">
          {item ? `Edit: ${item.code}` : 'New Salary Group'}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Code</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!item}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm disabled:opacity-50"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
                required
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Base Salary (monthly, IDR)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Daily Rate (leave 0 for auto)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Hourly Rate (leave 0 for auto)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSaving}>Save</Button>
        </div>
      </form>
    </div>
  );
}