'use client';

import { type FormEvent, useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import {
  useDeductionTypes,
  useCreateDeductionType,
  useUpdateDeductionType,
  useDeleteDeductionType,
} from '@/features/admin/hooks/useAdmin';
import type { PayrollDeductionType } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth/auth-context';
import { Plus, Edit3, Trash2 } from 'lucide-react';

const CALC_TYPES: Array<{ value: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER'; label: string }> = [
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'DAILY_RATE_MULTIPLIER', label: 'Daily Rate × Factor' },
];

function formatCurrency(value: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function DeductionTypesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('payroll_config.manage_tenant');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = { page, pageSize: 20, search: search || undefined };

  const { data, isLoading } = useDeductionTypes(params);
  const createMutation = useCreateDeductionType();
  const updateMutation = useUpdateDeductionType();
  const deleteMutation = useDeleteDeductionType();

  const [editingItem, setEditingItem] = useState<PayrollDeductionType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const types = data?.data ?? [];

  const calcLabel = (type: string) => CALC_TYPES.find((c) => c.value === type)?.label || type;

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: PayrollDeductionType) => <span className="font-mono text-xs font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: PayrollDeductionType) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'calculationType',
      header: 'Calculation',
      render: (row: PayrollDeductionType) => <span className="text-sm">{calcLabel(row.calculationType)}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      render: (row: PayrollDeductionType) => (
        <span className="font-semibold">
          {row.calculationType === 'PERCENTAGE' ? `${row.value}%` : formatCurrency(row.value)}
        </span>
      ),
    },
    {
      key: 'appliesToAll',
      header: 'Applies To',
      render: (row: PayrollDeductionType) => <span>{row.appliesToAll ? 'All employees' : 'Select employees'}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: PayrollDeductionType) => (
        <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: PayrollDeductionType) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" icon={Edit3} onClick={() => { setIsCreating(false); setEditingItem(row); }}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  onClick={async () => {
                    if (confirm(`Delete deduction type "${row.code}"?`)) {
                      try {
                        await deleteMutation.mutateAsync(row.id);
                        setFeedback('Deduction type deleted');
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
      title="Deduction Types"
      subtitle="Configure payroll deductions like BPJS, tax, and other fees applied per pay period"
      actions={
        canManage ? (
          <Button variant="accent" icon={Plus} onClick={() => { setIsCreating(true); setEditingItem(null); }}>
            Add Deduction
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
            data={types}
            loading={isLoading}
            emptyText="No deduction types configured. Add ones to apply deductions during payroll generation."
            rowKey="id"
          />
          {data?.meta && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                Showing {types.length} of {data.meta.total} types
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
        <DeductionTypeForm
          item={editingItem}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => { setEditingItem(null); setIsCreating(false); setFeedback(null); }}
          onSave={async (values) => {
            try {
              if (isCreating) {
                await createMutation.mutateAsync(values);
                setFeedback('Deduction type created');
              } else if (editingItem) {
                await updateMutation.mutateAsync({ id: editingItem.id, payload: values });
                setFeedback('Deduction type updated');
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

function DeductionTypeForm({
  item,
  isSaving,
  onClose,
  onSave,
}: {
  item: PayrollDeductionType | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: {
    code: string;
    name: string;
    calculationType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER';
    value: number;
    appliesToAll?: boolean;
    isActive?: boolean;
  }) => Promise<void>;
}) {
  const [code, setCode] = useState(item?.code || '');
  const [name, setName] = useState(item?.name || '');
  const [calculationType, setCalculationType] = useState<'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER'>(
    item?.calculationType || 'PERCENTAGE',
  );
  const [value, setValue] = useState(String(item?.value || ''));
  const [appliesToAll, setAppliesToAll] = useState(item?.appliesToAll ?? true);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({
      code,
      name,
      calculationType,
      value: Number(value || 0),
      appliesToAll,
      isActive,
    });
  }

  const valueLabel = () => {
    switch (calculationType) {
      case 'PERCENTAGE': return 'Percentage (%)';
      case 'FIXED_AMOUNT': return 'Fixed Amount (IDR)';
      case 'DAILY_RATE_MULTIPLIER': return 'Multiplier Factor';
      default: return 'Value';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-semibold text-[var(--color-text-primary)]">
          {item ? `Edit: ${item.code}` : 'New Deduction Type'}
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
            <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Calculation Type</span>
            <select
              value={calculationType}
              onChange={(e) => setCalculationType(e.target.value as 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER')}
              className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
            >
              {CALC_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{valueLabel()}</span>
            <input
              type="number"
              min="0"
              step={calculationType === 'PERCENTAGE' ? '0.01' : '1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
              required
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appliesToAll}
              onChange={(e) => setAppliesToAll(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Applies to all employees</span>
          </label>
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