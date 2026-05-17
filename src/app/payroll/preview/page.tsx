'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  Wallet,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterDatePicker, FilterReset, FilterSelect } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { useToastSimple } from '@/components/ui/toast-provider';
import { useCreatePayrollRun, usePayrollPreview } from '@/features/admin/hooks/useAdmin';
import { useBranchesQuery } from '@/features/master-data/branches/branches.hooks';
import { useDepartmentsQuery } from '@/features/master-data/departments/departments.hooks';
import { useDivisionsQuery } from '@/features/master-data/divisions/divisions.hooks';
import type { PayrollPreviewRow } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth/auth-context';

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentMonthRange() {
  const now = new Date();
  return {
    start: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPeriod(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${formatter.format(new Date(`${start}T00:00:00`))} - ${formatter.format(new Date(`${end}T00:00:00`))}`;
}

function SummaryMetric({
  title,
  value,
  icon: Icon,
  urgent,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  urgent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
          <p className={`mt-2 break-words text-xl font-semibold ${urgent ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`}>
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-premium)]">
          <Icon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
      </div>
    </Card>
  );
}

export default function PayrollPreviewPage() {
  const router = useRouter();
  const toast = useToastSimple();
  const { hasPermission } = useAuth();
  const defaultRange = useMemo(() => currentMonthRange(), []);
  const [periodStart, setPeriodStart] = useState(defaultRange.start);
  const [periodEnd, setPeriodEnd] = useState(defaultRange.end);
  const [branchId, setBranchId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const limit = 20;

  const periodInvalid = !periodStart || !periodEnd || periodStart > periodEnd;
  const params = {
    periodStart,
    periodEnd,
    page,
    limit,
    ...(branchId ? { branchId } : {}),
    ...(divisionId ? { divisionId } : {}),
    ...(departmentId ? { departmentId } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usePayrollPreview(params);
  const { data: branchesData } = useBranchesQuery({ pageSize: 100, status: 'ACTIVE' });
  const { data: divisionsData } = useDivisionsQuery({ pageSize: 100 });
  const { data: departmentsData } = useDepartmentsQuery({ pageSize: 100, ...(divisionId ? { divisionId } : {}) });
  const createRun = useCreatePayrollRun();

  const summary = data?.summary ?? {
    totalEmployeesIncluded: 0,
    totalGrossSalary: 0,
    totalDeduction: 0,
    totalNetSalary: 0,
    criticalAnomalies: 0,
    warningAnomalies: 0,
    pendingApprovals: 0,
  };
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const canGenerate = hasPermission('payroll_support.generate_tenant');
  const generateDisabled = periodInvalid || isLoading || summary.criticalAnomalies > 0 || !canGenerate;
  const hasActiveFilters = branchId || divisionId || departmentId;

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setBranchId('');
    setDivisionId('');
    setDepartmentId('');
    setPage(1);
  }

  async function handleConfirmGenerate() {
    try {
      const response = await createRun.mutateAsync({ periodStart, periodEnd });
      toast.success('Payroll run dibuat', response.message);
      setConfirmOpen(false);
      router.push('/payroll');
    } catch (err) {
      toast.error('Gagal membuat payroll run', err instanceof Error ? err.message : 'Silakan coba lagi.');
    }
  }

  const banner = summary.criticalAnomalies > 0
    ? {
        icon: AlertTriangle,
        className: 'border-[var(--color-danger)]/30 bg-red-50 text-[var(--color-danger)]',
        text: 'Payroll belum aman untuk digenerate. Selesaikan critical anomaly terlebih dahulu.',
        actionHref: '/payroll/anomalies',
        actionLabel: 'View Anomalies',
      }
    : summary.warningAnomalies > 0 || summary.pendingApprovals > 0
      ? {
          icon: AlertTriangle,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          text: 'Payroll dapat digenerate, tetapi masih ada data yang perlu direview.',
          actionHref: summary.pendingApprovals > 0 ? '/approvals' : '/payroll/anomalies',
          actionLabel: summary.pendingApprovals > 0 ? 'Review Approvals' : 'View Anomalies',
        }
      : {
          icon: CheckCircle,
          className: 'border-green-200 bg-green-50 text-green-800',
          text: 'Data payroll terlihat aman untuk digenerate.',
          actionHref: '',
          actionLabel: '',
        };
  const BannerIcon = banner.icon;

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row: PayrollPreviewRow) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {row.employeeCode}{row.departmentName ? ` - ${row.departmentName}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'salaryGroupName',
      header: 'Salary Group',
      render: (row: PayrollPreviewRow) => row.salaryGroupName || 'No salary group',
    },
    {
      key: 'grossSalary',
      header: 'Gross Salary',
      render: (row: PayrollPreviewRow) => <span className="font-medium">{formatCurrency(row.grossSalary)}</span>,
    },
    {
      key: 'totalDeduction',
      header: 'Deduction',
      render: (row: PayrollPreviewRow) => (
        <span className={row.totalDeduction > 0 ? 'text-[var(--color-danger)]' : ''}>
          {formatCurrency(row.totalDeduction)}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Salary',
      render: (row: PayrollPreviewRow) => <span className="font-semibold">{formatCurrency(row.netSalary)}</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (row: PayrollPreviewRow) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          P {row.attendanceSummary.presentDays} / L {row.attendanceSummary.lateDays} / A {row.attendanceSummary.absentDays} / Leave {row.attendanceSummary.leaveDays}
        </span>
      ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row: PayrollPreviewRow) => (
        <div className="flex max-w-72 flex-wrap gap-1.5">
          {row.flags.length === 0 ? (
            <span className="text-xs text-[var(--color-text-muted)]">Clear</span>
          ) : (
            row.flags.slice(0, 3).map((flag) => (
              <Badge
                key={`${row.employeeId}-${flag.type}-${flag.label}`}
                variant={flag.severity === 'critical' ? 'danger' : flag.severity === 'warning' ? 'warning' : 'info'}
              >
                {flag.label}
              </Badge>
            ))
          )}
          {row.flags.length > 3 && <Badge variant="neutral">+{row.flags.length - 3}</Badge>}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Payroll Preview"
      subtitle="Simulasikan payroll sebelum payroll run dibuat."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} isLoading={isFetching}>
            Refresh
          </Button>
          <Button
            variant="accent"
            icon={Wallet}
            disabled={generateDisabled}
            onClick={() => setConfirmOpen(true)}
            isLoading={createRun.isPending}
          >
            Generate Payroll Run
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <FilterBar>
          <FilterDatePicker value={periodStart} onChange={updateFilter(setPeriodStart)} />
          <FilterDatePicker value={periodEnd} onChange={updateFilter(setPeriodEnd)} />
          <FilterSelect
            placeholder="Branch"
            value={branchId}
            onChange={updateFilter(setBranchId)}
            options={(branchesData?.data ?? []).map((branch) => ({ value: branch.id, label: branch.name }))}
            className="max-w-52"
          />
          <FilterSelect
            placeholder="Division"
            value={divisionId}
            onChange={(value) => {
              setDivisionId(value);
              setDepartmentId('');
              setPage(1);
            }}
            options={(divisionsData?.data ?? []).map((division) => ({ value: division.id, label: division.name }))}
            className="max-w-52"
          />
          <FilterSelect
            placeholder="Department"
            value={departmentId}
            onChange={updateFilter(setDepartmentId)}
            options={(departmentsData?.data ?? []).map((department) => ({ value: department.id, label: department.name }))}
            className="max-w-52"
          />
          {hasActiveFilters && <FilterReset onClick={resetFilters}>Reset Filters</FilterReset>}
        </FilterBar>

        <div className={`flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${banner.className}`}>
          <div className="flex items-start gap-3">
            <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{banner.text}</p>
          </div>
          {banner.actionHref && (
            <Link href={banner.actionHref} className="text-sm font-semibold hover:underline">
              {banner.actionLabel}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric title="Employees Included" value={summary.totalEmployeesIncluded} icon={Users} />
          <SummaryMetric title="Gross Salary" value={formatCurrency(summary.totalGrossSalary)} icon={Wallet} />
          <SummaryMetric title="Total Deduction" value={formatCurrency(summary.totalDeduction)} icon={Receipt} />
          <SummaryMetric title="Net Salary" value={formatCurrency(summary.totalNetSalary)} icon={Wallet} />
          <SummaryMetric title="Critical Anomalies" value={summary.criticalAnomalies} icon={ShieldAlert} urgent={summary.criticalAnomalies > 0} />
          <SummaryMetric title="Pending Approvals" value={summary.pendingApprovals} icon={AlertTriangle} urgent={summary.pendingApprovals > 0} />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Period {periodStart} - {periodEnd}
            </p>
          </div>

          {isError || periodInvalid ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {periodInvalid ? 'Periode payroll tidak valid.' : 'Gagal memuat payroll preview.'}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {periodInvalid ? 'Pastikan period start tidak lebih besar dari period end.' : error instanceof Error ? error.message : 'Silakan coba lagi.'}
                </p>
              </div>
              {!periodInvalid && (
                <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={items}
                loading={isLoading}
                rowKey="employeeId"
                emptyText="Tidak ada karyawan yang masuk payroll untuk periode ini."
              />
              <Pagination
                currentPage={page}
                totalPages={Math.max(1, pagination?.totalPages ?? 1)}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmGenerate}
        title="Generate Payroll Run?"
        description={`Anda akan membuat payroll run untuk periode ${formatPeriod(periodStart, periodEnd)} dengan ${summary.totalEmployeesIncluded} karyawan. Data payroll akan disimpan sebagai draft dan dapat direview sebelum ditandai ready for payment.`}
        confirmLabel="Generate"
        cancelLabel="Cancel"
        variant={summary.warningAnomalies > 0 || summary.pendingApprovals > 0 ? 'warning' : 'info'}
        isLoading={createRun.isPending}
      >
        <div className="mb-6 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-left text-sm">
          <div className="flex justify-between gap-3"><span>Gross</span><strong>{formatCurrency(summary.totalGrossSalary)}</strong></div>
          <div className="flex justify-between gap-3"><span>Deduction</span><strong>{formatCurrency(summary.totalDeduction)}</strong></div>
          <div className="flex justify-between gap-3"><span>Net</span><strong>{formatCurrency(summary.totalNetSalary)}</strong></div>
          {(summary.warningAnomalies > 0 || summary.pendingApprovals > 0) && (
            <p className="mt-3 text-xs text-yellow-700">
              Masih ada {summary.warningAnomalies} warning anomaly dan {summary.pendingApprovals} pending approval yang perlu direview.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </PageWrapper>
  );
}
