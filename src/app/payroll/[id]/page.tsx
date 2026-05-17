'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Edit3, RefreshCw, RotateCcw, ShieldAlert, XCircle } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useToastSimple } from '@/components/ui/toast-provider';
import {
  useMarkPayrollReadyForPayment,
  usePayrollRun,
  useUpdatePayrollRunItem,
  useUpdatePayrollRunStatus,
} from '@/features/admin/hooks/useAdmin';
import type { PayrollRun, PayrollRunItem, PayrollRunStatus } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate, formatDateTime } from '@/lib/utils';

function formatCurrency(value: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function statusBadgeValue(status: PayrollRunStatus) {
  if (status === 'CANCELLED') return 'CANCELLED_PAYROLL';
  return status === 'DRAFT' ? 'DRAFT_PAYROLL' : status;
}

function statusLabel(status: PayrollRunStatus) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    UNDER_REVIEW: 'Under Review',
    READY_FOR_PAYMENT: 'Ready for Payment',
    CANCELLED: 'Cancelled',
    PAID: 'Paid',
    COMPLETED: 'Completed',
  };
  return labels[status] ?? status;
}

type StatusAction =
  | 'UNDER_REVIEW'
  | 'READY_FOR_PAYMENT'
  | 'DRAFT'
  | 'CANCELLED';

export default function PayrollRunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToastSimple();
  const { hasPermission } = useAuth();
  const runId = params.id;
  const { data, isLoading, isError, error, refetch, isFetching } = usePayrollRun(runId);
  const run = data?.data;
  const updateStatus = useUpdatePayrollRunStatus();
  const markReady = useMarkPayrollReadyForPayment();
  const updateItem = useUpdatePayrollRunItem();
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [editingItem, setEditingItem] = useState<PayrollRunItem | null>(null);

  const canAdjust = hasPermission('payroll_support.adjust_tenant');
  const canConvert = hasPermission('payroll_support.convert_payment_tenant');
  const editable = run ? ['DRAFT', 'UNDER_REVIEW'].includes(run.status) : false;
  const items = run?.items ?? [];

  const actionConfig = useMemo(() => {
    if (!statusAction || !run) return null;
    if (statusAction === 'UNDER_REVIEW' && run.status === 'READY_FOR_PAYMENT') {
      return {
        title: 'Reopen to Under Review?',
        description: 'Payroll run akan dibuka kembali ke tahap review. Item payroll dapat diedit lagi setelah status berubah.',
        requiresReason: true,
        confirmLabel: 'Reopen',
      };
    }
    if (statusAction === 'UNDER_REVIEW') {
      return {
        title: 'Move to Under Review?',
        description: 'Payroll run akan masuk tahap review. Data masih dapat diedit selama status Under Review.',
        requiresReason: false,
        confirmLabel: 'Move',
      };
    }
    if (statusAction === 'READY_FOR_PAYMENT') {
      return {
        title: 'Mark Ready for Payment?',
        description: 'Payroll run akan ditandai Ready for Payment. Setelah ini item payroll tidak dapat diedit kecuali run dibuka kembali.',
        requiresReason: false,
        confirmLabel: 'Mark Ready',
      };
    }
    if (statusAction === 'DRAFT') {
      return {
        title: 'Move Back to Draft?',
        description: 'Payroll run akan dikembalikan ke Draft. Alasan wajib diisi untuk perubahan korektif ini.',
        requiresReason: true,
        confirmLabel: 'Move Back',
      };
    }
    return {
      title: 'Cancel Payroll Run?',
      description: 'Payroll run akan dibatalkan. Tindakan ini membutuhkan alasan dan payroll run tidak dapat diproses lebih lanjut.',
      requiresReason: true,
      confirmLabel: 'Cancel Run',
    };
  }, [run, statusAction]);

  async function submitStatusAction() {
    if (!run || !statusAction || !actionConfig) return;
    if (actionConfig.requiresReason && !statusReason.trim()) {
      toast.error('Reason wajib diisi');
      return;
    }
    try {
      if (statusAction === 'READY_FOR_PAYMENT') {
        await markReady.mutateAsync({ id: run.id, reason: statusReason || undefined });
      } else {
        await updateStatus.mutateAsync({
          id: run.id,
          payload: { status: statusAction, reason: statusReason || undefined },
        });
      }
      toast.success('Payroll run diperbarui');
      setStatusAction(null);
      setStatusReason('');
    } catch (err) {
      toast.error('Gagal memperbarui payroll run', err instanceof Error ? err.message : 'Silakan coba lagi.');
    }
  }

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row: PayrollRunItem) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {row.employeeCode}{row.departmentName ? ` - ${row.departmentName}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Salary',
      render: (row: PayrollRunItem) => formatCurrency(row.grossEarnings + row.manualEarning, run?.currency),
    },
    {
      key: 'deduction',
      header: 'Deduction',
      render: (row: PayrollRunItem) => (
        <span className={row.totalDeduction > 0 ? 'text-[var(--color-danger)]' : ''}>
          {formatCurrency(row.totalDeduction, run?.currency)}
        </span>
      ),
    },
    {
      key: 'net',
      header: 'Net Salary',
      render: (row: PayrollRunItem) => <span className="font-semibold">{formatCurrency(row.netPay, run?.currency)}</span>,
    },
    {
      key: 'adjustment',
      header: 'Adjustment',
      render: (row: PayrollRunItem) => (
        <div className="text-xs text-[var(--color-text-secondary)]">
          <div>Earning {formatCurrency(row.manualEarning, run?.currency)}</div>
          <div>Deduction {formatCurrency(row.manualDeduction, run?.currency)}</div>
        </div>
      ),
    },
    {
      key: 'flags',
      header: 'Status/Flags',
      render: (row: PayrollRunItem) => (
        <span className="text-xs text-[var(--color-text-muted)]">
          {row.isManuallyEdited ? `Edited${row.adjustmentReason ? ` - ${row.adjustmentReason}` : ''}` : 'Snapshot'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: PayrollRunItem) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Edit3}
          disabled={!canAdjust || !editable}
          onClick={() => setEditingItem(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageWrapper
      title={run ? `Payroll Run - ${formatDate(run.periodStart)} to ${formatDate(run.periodEnd)}` : 'Payroll Run Detail'}
      subtitle={run ? `${run.itemCount} Employees · Net Salary ${formatCurrency(run.netTotal, run.currency)}` : 'Review payroll run snapshot.'}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/payroll">
            <Button variant="secondary" icon={ArrowLeft}>Back</Button>
          </Link>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} isLoading={isFetching}>
            Refresh
          </Button>
        </div>
      }
    >
      {isError ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ShieldAlert className="h-8 w-8 text-[var(--color-danger)]" />
          <p className="font-medium text-[var(--color-text-primary)]">Payroll run tidak dapat dimuat.</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {error instanceof Error ? error.message : 'Silakan coba lagi.'}
          </p>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {run && <StatusBadge status={statusBadgeValue(run.status)} />}
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Created {run ? formatDateTime(run.createdAt) : '-'}
                  </span>
                </div>
                <StatusProgress status={run?.status ?? 'DRAFT'} />
                {run?.cancelReason && (
                  <p className="text-sm text-[var(--color-danger)]">Cancel reason: {run.cancelReason}</p>
                )}
              </div>
              {run && (
                <div className="flex flex-wrap gap-2">
                  {run.status === 'DRAFT' && (
                    <>
                      <Button disabled={!canAdjust} icon={RefreshCw} onClick={() => setStatusAction('UNDER_REVIEW')}>Move to Under Review</Button>
                      <Button disabled={!canConvert} icon={CheckCircle} onClick={() => setStatusAction('READY_FOR_PAYMENT')}>Ready for Payment</Button>
                      <Button disabled={!canAdjust} variant="destructive" icon={XCircle} onClick={() => setStatusAction('CANCELLED')}>Cancel Run</Button>
                    </>
                  )}
                  {run.status === 'UNDER_REVIEW' && (
                    <>
                      <Button disabled={!canConvert} icon={CheckCircle} onClick={() => setStatusAction('READY_FOR_PAYMENT')}>Ready for Payment</Button>
                      <Button disabled={!canAdjust} variant="secondary" icon={RotateCcw} onClick={() => setStatusAction('DRAFT')}>Move Back to Draft</Button>
                      <Button disabled={!canAdjust} variant="destructive" icon={XCircle} onClick={() => setStatusAction('CANCELLED')}>Cancel Run</Button>
                    </>
                  )}
                  {run.status === 'READY_FOR_PAYMENT' && (
                    <Button disabled={!canAdjust} icon={RotateCcw} onClick={() => setStatusAction('UNDER_REVIEW')}>Reopen to Under Review</Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total Employees" value={run?.itemCount ?? 0} />
            <SummaryCard title="Gross Salary" value={formatCurrency(run?.grossTotal ?? 0, run?.currency)} />
            <SummaryCard title="Total Deduction" value={formatCurrency(run?.deductionTotal ?? 0, run?.currency)} danger />
            <SummaryCard title="Net Salary" value={formatCurrency(run?.netTotal ?? 0, run?.currency)} />
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-4">
              <p className="font-medium text-[var(--color-text-primary)]">Payroll Items</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Perubahan item hanya mengubah snapshot payroll run ini.
              </p>
            </div>
            <DataTable
              columns={columns}
              data={items}
              loading={isLoading}
              rowKey="id"
              emptyText="Payroll run tidak memiliki item."
              stickyHeader
            />
          </Card>
        </div>
      )}

      {editingItem && run && (
        <EditPayrollItemModal
          item={editingItem}
          currency={run.currency}
          isSaving={updateItem.isPending}
          onClose={() => setEditingItem(null)}
          onSave={async (values) => {
            try {
              await updateItem.mutateAsync({
                runId: run.id,
                itemId: editingItem.id,
                payload: values,
              });
              toast.success('Payroll item diperbarui');
              setEditingItem(null);
            } catch (err) {
              toast.error('Gagal memperbarui item', err instanceof Error ? err.message : 'Silakan coba lagi.');
            }
          }}
        />
      )}

      <Modal
        isOpen={!!statusAction}
        onClose={() => {
          setStatusAction(null);
          setStatusReason('');
        }}
        title={actionConfig?.title}
        size="md"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setStatusAction(null)}>Cancel</Button>
            <Button
              variant={statusAction === 'CANCELLED' ? 'destructive' : 'primary'}
              isLoading={updateStatus.isPending || markReady.isPending}
              onClick={submitStatusAction}
            >
              {actionConfig?.confirmLabel ?? 'Confirm'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">{actionConfig?.description}</p>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
              Reason {actionConfig?.requiresReason ? '(required)' : '(optional)'}
            </span>
            <textarea
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>
        </div>
      </Modal>
    </PageWrapper>
  );
}

function StatusProgress({ status }: { status: PayrollRunStatus }) {
  if (status === 'CANCELLED') {
    return <p className="text-sm font-medium text-[var(--color-danger)]">Cancelled</p>;
  }
  const steps: PayrollRunStatus[] = ['DRAFT', 'UNDER_REVIEW', 'READY_FOR_PAYMENT'];
  const currentIndex = steps.indexOf(status);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <span className={index <= currentIndex ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}>
            {statusLabel(step)}
          </span>
          {index < steps.length - 1 && <span className="text-[var(--color-text-muted)]">→</span>}
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ title, value, danger }: { title: string; value: string | number; danger?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
      <p className={`mt-2 break-words text-2xl font-semibold ${danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`}>
        {value}
      </p>
    </Card>
  );
}

function EditPayrollItemModal({
  item,
  currency,
  isSaving,
  onClose,
  onSave,
}: {
  item: PayrollRunItem;
  currency: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: { baseSalary: number; manualEarning: number; manualDeduction: number; notes?: string; reason?: string }) => Promise<void>;
}) {
  const [baseSalary, setBaseSalary] = useState(String(item.baseSalary));
  const [manualEarning, setManualEarning] = useState(String(item.manualEarning));
  const [manualDeduction, setManualDeduction] = useState(String(item.manualDeduction));
  const [notes, setNotes] = useState(item.notes || '');
  const [reason, setReason] = useState(item.adjustmentReason || '');

  const amountChanged = Number(baseSalary || 0) !== item.baseSalary
    || Number(manualEarning || 0) !== item.manualEarning
    || Number(manualDeduction || 0) !== item.manualDeduction;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amountChanged && !reason.trim()) {
      return;
    }
    await onSave({
      baseSalary: Number(baseSalary || 0),
      manualEarning: Number(manualEarning || 0),
      manualDeduction: Number(manualDeduction || 0),
      notes,
      reason: reason || undefined,
    });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit ${item.employeeName}`}
      size="lg"
      footer={
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="payroll-item-edit-form" isLoading={isSaving} disabled={amountChanged && !reason.trim()}>
            Save Changes
          </Button>
        </ModalFooter>
      }
    >
      <form id="payroll-item-edit-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Perubahan ini hanya mengubah snapshot payroll run ini dan tidak mengubah data employee, attendance, atau leave asli.
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ReadOnlyValue label="Current Net" value={formatCurrency(item.netPay, currency)} />
          <ReadOnlyValue label="Current Deduction" value={formatCurrency(item.totalDeduction, currency)} />
          <ReadOnlyValue label="Salary Group" value={item.salaryGroup || '-'} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MoneyInput label="Base Salary" value={baseSalary} onChange={setBaseSalary} />
          <MoneyInput label="Manual Earning" value={manualEarning} onChange={setManualEarning} />
          <MoneyInput label="Manual Deduction" value={manualDeduction} onChange={setManualDeduction} />
        </div>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
            Reason {amountChanged ? '(required)' : '(optional)'}
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-20 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          {amountChanged && !reason.trim() && (
            <p className="text-xs text-[var(--color-danger)]">Reason wajib diisi untuk perubahan nominal.</p>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-20 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </label>
      </form>
    </Modal>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <p className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
      />
    </label>
  );
}
