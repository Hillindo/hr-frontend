'use client';

import { useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect, FilterDatePicker } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { Download, Eye, UserCheck, CalendarClock, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeamAttendance, useTeamAttendanceSummary, useCreateAssistedAttendance } from '@/features/admin/hooks/useAdmin';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function TeamAttendancePage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const queryParams: Record<string, unknown> = {
    limit: 100,
    startDate,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(departmentFilter ? { departmentId: departmentFilter } : {}),
    ...(search ? { search } : {}),
  };

  const { data: attendanceData, isLoading } = useTeamAttendance(queryParams);
  const { data: summaryData } = useTeamAttendanceSummary({
    date: startDate,
    ...(departmentFilter ? { departmentId: departmentFilter } : {}),
  });

  const createAssisted = useCreateAssistedAttendance();

  const records = attendanceData?.data ?? [];
  const summary = summaryData?.data;

  const filteredRecords = records.filter((r) => {
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) && !r.employeeCode.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const departments = [...new Set(records.map((r) => r.departmentName).filter(Boolean))] as string[];

  const columns = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (row: typeof records[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName} size="sm" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'departmentName', header: 'Department' },
    {
      key: 'checkInAt',
      header: 'Check In',
      render: (row: typeof records[0]) => (
        <span className={`text-sm font-mono ${!row.checkInAt ? 'text-[var(--color-text-muted)]' : ''}`}>
          {row.checkInAt || '-'}
        </span>
      ),
    },
    {
      key: 'checkOutAt',
      header: 'Check Out',
      render: (row: typeof records[0]) => (
        <span className={`text-sm font-mono ${!row.checkOutAt && row.status === 'PRESENT' ? 'text-[var(--color-warning)]' : ''}`}>
          {row.checkOutAt || (row.status === 'PRESENT' ? 'Missing' : '-')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof records[0]) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lateMinutes',
      header: 'Late (min)',
      render: (row: typeof records[0]) => (
        <span className={`text-sm ${row.lateMinutes > 0 ? 'text-[var(--color-warning)] font-medium' : ''}`}>
          {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-32',
      render: (row: typeof records[0]) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/employees/${row.employeeId}?tab=attendance`); }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
            title="View detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedEmployee(row.employeeId); setConfirmDialogOpen(true); }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
            title="Mark as assisted"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const getRowClass = (row: typeof records[0]) => {
    if (row.status === 'ABSENT' || row.status === 'absent') return 'bg-[var(--color-danger-bg)]/20';
    if (row.status === 'LATE' || row.status === 'late' || (!row.checkOutAt && row.status === 'PRESENT')) return 'bg-[var(--color-warning-bg)]/20';
    return '';
  };

  return (
    <ManagerPageWrapper
      title="Team Attendance"
      subtitle="Monitor and manage your team's daily attendance"
      actions={<Button variant="secondary" icon={Download}>Export</Button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Present" value={summary?.present ?? 0} subtext="On time today" icon={CheckCircle} accent />
        <SummaryCard title="Late" value={summary?.late ?? 0} subtext="Arrived late" icon={Clock} urgent={(summary?.late ?? 0) > 0} />
        <SummaryCard title="Absent" value={summary?.absent ?? 0} subtext="Did not check in" icon={AlertTriangle} urgent={(summary?.absent ?? 0) > 0} />
        <SummaryCard title="On Leave" value={summary?.onLeave ?? 0} subtext="Approved leave" icon={CalendarClock} />
      </div>

      <FilterBar className="mb-6">
        <FilterDatePicker value={startDate} onChange={setStartDate} />
        <FilterSelect
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'PRESENT', label: 'Present' },
            { value: 'LATE', label: 'Late' },
            { value: 'ABSENT', label: 'Absent' },
            { value: 'ON_LEAVE', label: 'On Leave' },
            { value: 'SICK', label: 'Sick' },
            { value: 'PERMISSION', label: 'Permission' },
          ]}
        />
        <FilterSelect
          placeholder="Department"
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={departments.map((d) => ({ value: d, label: d }))}
        />
        <FilterInput placeholder="Search employee..." value={search} onChange={setSearch} />
      </FilterBar>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedRecords}
              emptyText="No attendance records found"
              rowClassName={(row: typeof records[0]) => getRowClass(row)}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredRecords.length / pageSize))}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--color-warning-bg)]" />
          <span className="text-[var(--color-text-muted)]">Late / Missing checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--color-danger-bg)]" />
          <span className="text-[var(--color-text-muted)]">Absent</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setSelectedEmployee(null); }}
        onConfirm={async () => {
          if (!selectedEmployee || !startDate) return;
          await createAssisted.mutateAsync({
            employeeId: selectedEmployee,
            workDate: startDate,
            status: 'PRESENT',
          });
          setConfirmDialogOpen(false);
          setSelectedEmployee(null);
        }}
        title="Mark Attendance as Assisted"
        description="Are you sure you want to mark this attendance as HR-assisted?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant="warning"
      />
    </ManagerPageWrapper>
  );
}