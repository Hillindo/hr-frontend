'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterDatePicker, FilterInput, FilterReset, FilterSelect } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { usePayrollRuns } from '@/features/admin/hooks/useAdmin';
import type { PayrollRun, PayrollRunStatus } from '@/lib/api/admin';
import { formatDate, formatDateTime } from '@/lib/utils';

function formatCurrency(value: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function payrollStatusLabel(status: PayrollRunStatus) {
  if (status === 'CANCELLED') return 'CANCELLED_PAYROLL';
  return status === 'DRAFT' ? 'DRAFT_PAYROLL' : status;
}

export default function PayrollRunsPage() {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const params = {
    page,
    pageSize,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    ...(periodStart ? { periodStart } : {}),
    ...(periodEnd ? { periodEnd } : {}),
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isFetching, refetch, isError, error } = usePayrollRuns(params);
  const runs = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = periodStart || periodEnd || status || search;

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setPeriodStart('');
    setPeriodEnd('');
    setStatus('');
    setSearch('');
    setPage(1);
  }

  const columns = [
    {
      key: 'period',
      header: 'Period',
      render: (row: PayrollRun) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">
            {formatDate(row.periodStart)} - {formatDate(row.periodEnd)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Created {formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: PayrollRun) => <StatusBadge status={payrollStatusLabel(row.status)} />,
    },
    { key: 'itemCount', header: 'Employees' },
    {
      key: 'grossTotal',
      header: 'Gross',
      render: (row: PayrollRun) => formatCurrency(row.grossTotal, row.currency),
    },
    {
      key: 'deductionTotal',
      header: 'Deduction',
      render: (row: PayrollRun) => (
        <span className={row.deductionTotal > 0 ? 'text-[var(--color-danger)]' : ''}>
          {formatCurrency(row.deductionTotal, row.currency)}
        </span>
      ),
    },
    {
      key: 'netTotal',
      header: 'Net Salary',
      render: (row: PayrollRun) => <span className="font-semibold">{formatCurrency(row.netTotal, row.currency)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: PayrollRun) => (
        <Link href={`/payroll/${row.id}`}>
          <Button size="sm" variant="ghost" icon={Eye}>
            View Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Payroll Runs"
      subtitle="Review payroll snapshots and move them through Draft, Under Review, and Ready for Payment."
      actions={
        <div className="flex gap-2">
          <Link href="/payroll/preview">
            <Button variant="secondary" icon={Search}>Open Preview</Button>
          </Link>
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} isLoading={isFetching}>
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <FilterBar>
          <FilterDatePicker value={periodStart} onChange={updateFilter(setPeriodStart)} />
          <FilterDatePicker value={periodEnd} onChange={updateFilter(setPeriodEnd)} />
          <FilterSelect
            placeholder="Status"
            value={status}
            onChange={updateFilter(setStatus)}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'READY_FOR_PAYMENT', label: 'Ready for Payment' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <FilterInput placeholder="Search period..." value={search} onChange={updateFilter(setSearch)} />
          {hasFilters && <FilterReset onClick={resetFilters}>Reset Filters</FilterReset>}
        </FilterBar>

        <Card className="overflow-hidden">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-medium text-[var(--color-text-primary)]">Gagal memuat payroll runs.</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {error instanceof Error ? error.message : 'Silakan coba lagi.'}
              </p>
              <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={runs}
                loading={isLoading}
                rowKey="id"
                emptyText="Belum ada payroll run. Mulai dari Payroll Preview untuk membuat run baru."
              />
              <Pagination
                currentPage={page}
                totalPages={Math.max(1, meta?.totalPages ?? 1)}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
