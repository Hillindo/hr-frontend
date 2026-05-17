'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterDatePicker, FilterInput, FilterReset, FilterSelect } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { usePayrollAnomalies } from '@/features/admin/hooks/useAdmin';
import { useBranchesQuery } from '@/features/master-data/branches/branches.hooks';
import { useDepartmentsQuery } from '@/features/master-data/departments/departments.hooks';
import type { PayrollAnomaly, PayrollAnomalyType } from '@/lib/api/admin';

const ANOMALY_TYPE_OPTIONS: Array<{ value: PayrollAnomalyType; label: string }> = [
  { value: 'missing_salary_group', label: 'Missing Salary Group' },
  { value: 'missing_bank_account', label: 'Missing Bank Account' },
  { value: 'missing_tax_number', label: 'Missing NPWP' },
  { value: 'missing_bpjs', label: 'Missing BPJS' },
  { value: 'missing_schedule', label: 'Missing Schedule' },
  { value: 'incomplete_attendance', label: 'Incomplete Attendance' },
  { value: 'pending_attendance_correction', label: 'Pending Attendance Correction' },
  { value: 'pending_leave_request', label: 'Pending Leave Request' },
  { value: 'unpaid_leave', label: 'Unpaid Leave' },
  { value: 'resigned_employee_included', label: 'Resigned Employee Included' },
  { value: 'joined_mid_period', label: 'Joined Mid Period' },
  { value: 'incomplete_deduction_data', label: 'Incomplete Deduction Data' },
];

function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: first.toISOString().slice(0, 10),
    end: last.toISOString().slice(0, 10),
  };
}

function severityVariant(severity: PayrollAnomaly['severity']) {
  if (severity === 'critical') return 'danger';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function severityLabel(severity: PayrollAnomaly['severity']) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export default function PayrollAnomaliesPage() {
  const defaultRange = useMemo(() => currentMonthRange(), []);
  const [periodStart, setPeriodStart] = useState(defaultRange.start);
  const [periodEnd, setPeriodEnd] = useState(defaultRange.end);
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = {
    periodStart,
    periodEnd,
    limit,
    page,
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(severity ? { severity } : {}),
    ...(type ? { type } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usePayrollAnomalies(params);
  const { data: branchesData } = useBranchesQuery({ pageSize: 100, status: 'ACTIVE' });
  const { data: departmentsData } = useDepartmentsQuery({ pageSize: 100, status: 'ACTIVE' });
  const summary = data?.summary ?? { total: 0, critical: 0, warning: 0, info: 0 };
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const branches = branchesData?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const hasActiveFilters = branchId || departmentId || severity || type || search;

  function resetFilters() {
    setBranchId('');
    setDepartmentId('');
    setSeverity('');
    setType('');
    setSearch('');
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  const banner = summary.critical > 0
    ? {
        icon: AlertTriangle,
        className: 'border-[var(--color-danger)]/30 bg-red-50 text-[var(--color-danger)]',
        text: 'Payroll belum aman untuk dijalankan. Selesaikan critical issue terlebih dahulu sebelum generate payroll.',
      }
    : summary.warning > 0
      ? {
          icon: AlertTriangle,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          text: 'Payroll dapat dilanjutkan, tetapi beberapa data masih perlu direview.',
        }
      : {
          icon: CheckCircle,
          className: 'border-green-200 bg-green-50 text-green-800',
          text: 'Data payroll terlihat aman untuk periode ini.',
        };
  const BannerIcon = banner.icon;

  const columns = [
    {
      key: 'severity',
      header: 'Severity',
      width: 'w-32',
      render: (row: PayrollAnomaly) => (
        <Badge variant={severityVariant(row.severity)}>{severityLabel(row.severity)}</Badge>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (row: PayrollAnomaly) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {row.employeeCode}{row.departmentName ? ` - ${row.departmentName}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Masalah',
      render: (row: PayrollAnomaly) => <span className="text-[var(--color-text-primary)]">{row.message}</span>,
    },
    {
      key: 'payrollImpact',
      header: 'Dampak Payroll',
      render: (row: PayrollAnomaly) => <span className="text-[var(--color-text-secondary)]">{row.payrollImpact}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      width: 'w-44',
      render: (row: PayrollAnomaly) => (
        <Link
          href={row.actionHref}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50"
        >
          {row.actionLabel}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Payroll Anomalies"
      subtitle="Cek data yang belum aman sebelum payroll dijalankan."
      actions={
        <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} isLoading={isFetching}>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <FilterBar>
          <FilterDatePicker value={periodStart} onChange={updateFilter(setPeriodStart)} />
          <FilterDatePicker value={periodEnd} onChange={updateFilter(setPeriodEnd)} />
          <FilterInput placeholder="Search employee..." value={search} onChange={updateFilter(setSearch)} />
          <FilterSelect
            placeholder="Branch"
            value={branchId}
            onChange={updateFilter(setBranchId)}
            options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
            className="max-w-52"
          />
          <FilterSelect
            placeholder="Department"
            value={departmentId}
            onChange={updateFilter(setDepartmentId)}
            options={departments.map((department) => ({ value: department.id, label: department.name }))}
            className="max-w-52"
          />
          <FilterSelect
            placeholder="Severity"
            value={severity}
            onChange={updateFilter(setSeverity)}
            options={[
              { value: 'critical', label: 'Critical' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
            ]}
          />
          <FilterSelect
            placeholder="Type"
            value={type}
            onChange={updateFilter(setType)}
            options={ANOMALY_TYPE_OPTIONS}
            className="max-w-64"
          />
          {hasActiveFilters && <FilterReset onClick={resetFilters}>Reset Filters</FilterReset>}
        </FilterBar>

        <div className={`flex items-start gap-3 rounded-xl border p-4 ${banner.className}`}>
          <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{banner.text}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard title="Total Issues" value={summary.total} />
          <SummaryCard title="Critical" value={summary.critical} urgent={summary.critical > 0} />
          <SummaryCard title="Warning" value={summary.warning} />
          <SummaryCard title="Info" value={summary.info} />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Period {periodStart} - {periodEnd}
            </p>
          </div>

          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">Gagal memuat payroll anomalies.</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {error instanceof Error ? error.message : 'Silakan coba lagi.'}
                </p>
              </div>
              <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={items}
                loading={isLoading}
                rowKey="id"
                emptyText="Tidak ada payroll anomaly untuk periode ini. Data payroll terlihat aman untuk dilanjutkan ke tahap preview."
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
    </PageWrapper>
  );
}
