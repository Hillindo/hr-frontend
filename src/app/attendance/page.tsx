'use client';

import { Suspense, useDeferredValue, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Plus,
  Upload,
  XCircle,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { StatusBadge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/ui/card';
import { Tabs, TabPanel } from '@/components/ui/common';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterDatePicker, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import {
  useAttendanceCorrections,
  useAttendanceList,
  useAttendanceSummary,
  useCreateAssistedAttendance,
  useEmployeeList,
} from '@/features/admin/hooks/useAdmin';

function isDateParam(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function AttendancePage() {
  return (
    <Suspense fallback={null}>
      <AttendancePageContent />
    </Suspense>
  );
}

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split('T')[0];
  const urlStartDate = searchParams.get('startDate');
  const urlEndDate = searchParams.get('endDate');
  const initialStartDate = isDateParam(urlStartDate) ? urlStartDate : today;
  const initialEndDate = isDateParam(urlEndDate) ? urlEndDate : initialStartDate;
  const [activeTab, setActiveTab] = useState('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(initialStartDate);
  const [endDateFilter, setEndDateFilter] = useState(initialEndDate);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [, setCursorHistory] = useState<Array<string | null>>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [assistedForm, setAssistedForm] = useState({
    employeeId: '',
    workDate: new Date().toISOString().split('T')[0],
    checkInAt: '',
    checkOutAt: '',
    status: 'PRESENT' as string,
    notes: '',
  });
  const [formMessage, setFormMessage] = useState('');

  const isAssistedModalOpen = searchParams.get('assisted') === 'true';
  const employeeFilter = searchParams.get('employee') ?? searchParams.get('employeeId') ?? '';
  const deferredSearch = useDeferredValue(search.trim());
  const deferredEmployeeSearch = useDeferredValue(employeeSearch.trim());
  const shouldLoadEmployeeOptions =
    isAssistedModalOpen && (deferredEmployeeSearch.length === 0 || deferredEmployeeSearch.length >= 2);

  const resetAttendancePagination = () => {
    setCurrentPage(1);
    setCurrentCursor(null);
    setCursorHistory([]);
  };

  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceList(
    {
      startDate: startDateFilter,
      endDate: endDateFilter,
      limit: pageSize,
      ...(currentCursor ? { cursor: currentCursor } : {}),
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(employeeFilter ? { employeeId: employeeFilter } : {}),
    },
    {
      placeholderData: (previousData) => previousData,
    },
  );

  const { data: summaryData } = useAttendanceSummary({
    startDate: startDateFilter,
    endDate: endDateFilter,
    ...(employeeFilter ? { employeeId: employeeFilter } : {}),
  });

  const { data: correctionsData } = useAttendanceCorrections(
    { limit: 20 },
    {
      enabled: activeTab === 'corrections',
    },
  );

  const { data: employeesData, isLoading: employeesLoading } = useEmployeeList(
    {
      page: 1,
      pageSize: 20,
      isActive: 'true',
      ...(deferredEmployeeSearch ? { search: deferredEmployeeSearch } : {}),
    },
    {
      enabled: shouldLoadEmployeeOptions,
      placeholderData: (previousData) => previousData,
    },
  );

  const createAssisted = useCreateAssistedAttendance();

  const records = attendanceData?.data ?? [];
  const summary = summaryData?.data;
  const corrections = correctionsData?.data ?? [];
  const employees = employeesData?.data ?? [];
  const hasNextAttendancePage = attendanceData?.meta.hasNext ?? false;
  const nextAttendanceCursor = attendanceData?.meta.nextCursor ?? null;

  const presentCount = summary?.present ?? 0;
  const lateCount = summary?.late ?? 0;
  const absentCount = summary?.absent ?? 0;
  const onLeaveCount = summary?.onLeave ?? 0;
  const missingCheckoutCount = summary?.missingCheckout ?? 0;
  const summaryScopeText = startDateFilter === endDateFilter ? startDateFilter : `${startDateFilter} to ${endDateFilter}`;

  const buildAttendanceUrl = (options?: { assisted?: boolean }) => {
    const params = new URLSearchParams();
    if (employeeFilter) params.set('employee', employeeFilter);
    if (startDateFilter) params.set('startDate', startDateFilter);
    if (endDateFilter) params.set('endDate', endDateFilter);
    if (options?.assisted) params.set('assisted', 'true');
    const queryString = params.toString();
    return queryString ? `/attendance?${queryString}` : '/attendance';
  };

  const handleStartDateChange = (value: string) => {
    const nextValue = value || today;
    setStartDateFilter(nextValue);
    if (nextValue > endDateFilter) {
      setEndDateFilter(nextValue);
    }
    resetAttendancePagination();
  };

  const handleEndDateChange = (value: string) => {
    const nextValue = value || startDateFilter;
    setEndDateFilter(nextValue);
    if (nextValue < startDateFilter) {
      setStartDateFilter(nextValue);
    }
    resetAttendancePagination();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetAttendancePagination();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetAttendancePagination();
  };

  const closeAssistedModal = () => {
    setFormMessage('');
    setEmployeeSearch('');
    router.replace(buildAttendanceUrl());
  };

  const handleAssistedSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assistedForm.employeeId) {
      setFormMessage('Please select an employee.');
      return;
    }

    try {
      await createAssisted.mutateAsync({
        employeeId: assistedForm.employeeId,
        workDate: assistedForm.workDate,
        checkInAt: assistedForm.checkInAt || undefined,
        checkOutAt: assistedForm.checkOutAt || undefined,
        status: assistedForm.status,
        notes: assistedForm.notes || undefined,
      });
      setAssistedForm({
        employeeId: '',
        workDate: new Date().toISOString().split('T')[0],
        checkInAt: '',
        checkOutAt: '',
        status: 'PRESENT',
        notes: '',
      });
      closeAssistedModal();
    } catch {
      setFormMessage('Failed to create assisted attendance. Please try again.');
    }
  };

  const handleAttendanceNextPage = () => {
    if (!nextAttendanceCursor) return;
    setCursorHistory((previous) => [...previous, currentCursor]);
    setCurrentCursor(nextAttendanceCursor);
    setCurrentPage((previous) => previous + 1);
  };

  const handleAttendancePreviousPage = () => {
    setCursorHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const previousCursor = nextHistory.pop() ?? null;
      setCurrentCursor(previousCursor);
      setCurrentPage((page) => Math.max(1, page - 1));
      return nextHistory;
    });
  };

  const formatAttendanceTime = (value?: string | null) => {
    if (!value) return '-';
    return formatTime(value);
  };

  const dailyColumns = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (row: (typeof records)[number]) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
        </div>
      ),
    },
    { key: 'departmentName', header: 'Department', sortable: true },
    {
      key: 'checkInAt',
      header: 'Check In',
      render: (row: (typeof records)[number]) => formatAttendanceTime(row.checkInAt),
    },
    {
      key: 'checkOutAt',
      header: 'Check Out',
      render: (row: (typeof records)[number]) =>
        row.checkOutAt ? formatAttendanceTime(row.checkOutAt) : <span className="text-[var(--color-warning)]">Missing</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: (typeof records)[number]) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lateMinutes',
      header: 'Late (min)',
      render: (row: (typeof records)[number]) =>
        row.lateMinutes > 0 ? <span className="font-medium text-[var(--color-warning)]">{row.lateMinutes}</span> : '-',
    },
    {
      key: 'source',
      header: 'Source',
      render: (row: (typeof records)[number]) => {
        const sourceLabels: Record<string, string> = {
          SELF_SERVICE: 'Self',
          IMPORT: 'Import',
          HR_ASSISTED: 'HR Assisted',
          SYSTEM: 'System',
        };
        return sourceLabels[row.source] || row.source;
      },
    },
    {
      key: 'actions',
      header: '',
      width: 'w-40',
      render: (row: (typeof records)[number]) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/employees/${row.employeeId}?tab=attendance`)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-[var(--color-info)] transition-colors hover:bg-[var(--color-info-bg)]"
          >
            Detail
          </button>
          <button
            onClick={() => router.push(`/employees/${row.employeeId}?tab=attendance-history`)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-gray-100"
          >
            History
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'daily', label: 'Daily Attendance', count: records.length },
    { id: 'monthly', label: 'Monthly Recap' },
    { id: 'corrections', label: 'Correction Requests', count: corrections.length },
  ];

  return (
    <PageWrapper
      title="Attendance"
      subtitle="Track daily attendance and resolve attendance issues"
      actions={
        <>
          <Button variant="secondary" icon={Upload} onClick={() => router.push('/attendance?import=true')}>
            Import Attendance
          </Button>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => router.push(buildAttendanceUrl({ assisted: true }))}
          >
            Add Assisted
          </Button>
          <Button variant="secondary" icon={Download}>
            Export
          </Button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard title="Present" value={presentCount} subtext={summaryScopeText} icon={CheckCircle} accent />
        <SummaryCard title="Late" value={lateCount} subtext="After 08:00" icon={Clock} urgent={lateCount > 0} accent />
        <SummaryCard title="Absent" value={absentCount} subtext="No check-in" icon={XCircle} urgent={absentCount > 0} accent />
        <SummaryCard title="On Leave" value={onLeaveCount} subtext="Approved leave" icon={CalendarClock} accent />
        <SummaryCard title="Missing Checkout" value={missingCheckoutCount} subtext="No check-out" icon={AlertTriangle} urgent accent />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'daily'}>
          <FilterBar className="mb-6">
            <FilterInput placeholder="Search employee..." value={search} onChange={handleSearchChange} />
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>Start</span>
              <FilterDatePicker value={startDateFilter} onChange={handleStartDateChange} className="w-36" />
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>End</span>
              <FilterDatePicker value={endDateFilter} onChange={handleEndDateChange} className="w-36" />
            </label>
            <FilterSelect
              placeholder="Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { value: 'PRESENT', label: 'Present' },
                { value: 'LATE', label: 'Late' },
                { value: 'ABSENT', label: 'Absent' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'SICK', label: 'Sick' },
                { value: 'PERMISSION', label: 'Permission' },
              ]}
            />
          </FilterBar>

          {attendanceLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-accent)]" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              <DataTable columns={dailyColumns} data={records} emptyText="No attendance records found" />
              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Page <span className="font-medium">{currentPage}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAttendancePreviousPage}
                    disabled={currentPage === 1 || attendanceLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleAttendanceNextPage}
                    disabled={!hasNextAttendancePage || attendanceLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </TabPanel>

        <TabPanel isActive={activeTab === 'monthly'}>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <p className="text-center text-[var(--color-text-muted)]">
              Monthly recap will be available with aggregated data from the API.
            </p>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'corrections'}>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
            {corrections.length > 0 ? (
              <p className="text-center text-[var(--color-text-muted)]">
                {corrections.length} correction requests found. Correction review will be implemented in next iteration.
              </p>
            ) : (
              <p className="text-center text-[var(--color-text-muted)]">No correction requests</p>
            )}
          </div>
        </TabPanel>
      </div>

      <Modal
        isOpen={isAssistedModalOpen}
        onClose={closeAssistedModal}
        title="Add Assisted Attendance"
        size="lg"
        footer={
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={closeAssistedModal}>
              Cancel
            </Button>
            <Button type="submit" form="assisted-attendance-form" icon={CheckCircle}>
              Save Attendance
            </Button>
          </ModalFooter>
        }
      >
        <form id="assisted-attendance-form" onSubmit={handleAssistedSubmit} className="space-y-5">
          {formMessage && (
            <div className="rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {formMessage}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Search employee</span>
              <input
                type="text"
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Type name, employee ID, or email"
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              />
              {employeeSearch.trim().length === 1 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Type at least 2 characters to narrow employee results.
                </p>
              )}
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Employee</span>
              <select
                required
                value={assistedForm.employeeId}
                onChange={(event) => setAssistedForm((current) => ({ ...current, employeeId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              >
                <option value="">Select employee</option>
                {employeesLoading && (
                  <option value="" disabled>
                    Loading employees...
                  </option>
                )}
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.employeeCode}
                  </option>
                ))}
              </select>
              {shouldLoadEmployeeOptions && employeesData?.meta && employeesData.meta.total > employees.length && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Showing first {employees.length} matching employees. Refine the search to narrow results.
                </p>
              )}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Work Date</span>
              <input
                required
                type="date"
                value={assistedForm.workDate}
                onChange={(event) => setAssistedForm((current) => ({ ...current, workDate: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Status</span>
              <select
                value={assistedForm.status}
                onChange={(event) => setAssistedForm((current) => ({ ...current, status: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SICK">Sick</option>
                <option value="PERMISSION">Permission</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Check In</span>
              <input
                type="time"
                value={assistedForm.checkInAt}
                onChange={(event) => setAssistedForm((current) => ({ ...current, checkInAt: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">Check Out</span>
              <input
                type="time"
                value={assistedForm.checkOutAt}
                onChange={(event) => setAssistedForm((current) => ({ ...current, checkOutAt: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">HR Notes</span>
            <textarea
              rows={4}
              value={assistedForm.notes}
              onChange={(event) => setAssistedForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Reason or supporting note for HR-assisted attendance"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
            />
          </label>
        </form>
      </Modal>
    </PageWrapper>
  );
}
