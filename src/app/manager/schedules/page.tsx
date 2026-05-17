'use client';

import { useMemo, useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect, FilterDatePicker } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import {
  useAssignSchedule,
  useDirectReports,
  useEmployeeList,
  usePublishSchedule,
  useScheduleList,
} from '@/features/admin/hooks/useAdmin';
import { useShiftsQuery } from '@/features/master-data/shifts/shifts.hooks';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import type { ScheduleItem } from '@/lib/api/admin';

function normalizeScheduleStatus(status?: string) {
  return (status ?? '').toUpperCase();
}

function getScheduleEmployeeName(schedule: ScheduleItem) {
  return schedule.employeeName ?? schedule.employee?.fullName ?? 'Unknown Employee';
}

function getScheduleShiftName(schedule: ScheduleItem) {
  return schedule.shiftName ?? schedule.shift?.name ?? '-';
}

export default function SchedulesPage() {
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const employeeIdFilter = searchParams.get('employeeId') ?? '';
  const canReadTenantEmployees = hasPermission('employees.read_tenant');
  const canReadTeamEmployees = hasPermission('employees.read_team');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', shiftId: '', date: '', note: '' });
  const [publishForm, setPublishForm] = useState({ startDate: '', endDate: '' });

  const queryParams: Record<string, unknown> = {
    take: 200,
    skip: 0,
    ...(employeeIdFilter ? { employeeId: employeeIdFilter } : {}),
    ...(shiftFilter ? { shiftId: shiftFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(dateFrom ? { startDate: dateFrom } : {}),
    ...(dateTo ? { endDate: dateTo } : {}),
  };

  const { data: scheduleData, isLoading } = useScheduleList(queryParams);
  const { data: shiftsData } = useShiftsQuery({ pageSize: 100, isActive: 'true' });
  const { data: employeeData } = useEmployeeList(
    { pageSize: 100, isActive: 'true' },
    { enabled: canReadTenantEmployees },
  );
  const { data: teamData } = useDirectReports({
    enabled: !canReadTenantEmployees && canReadTeamEmployees,
  });
  const assignSchedule = useAssignSchedule();
  const publishSchedule = usePublishSchedule();

  const schedules = scheduleData?.data ?? [];
  const shifts = shiftsData?.data ?? [];
  const employeeOptions = useMemo(() => {
    if (canReadTenantEmployees) {
      return employeeData?.data ?? [];
    }
    return teamData?.data ?? [];
  }, [canReadTenantEmployees, employeeData?.data, teamData?.data]);

  const filteredSchedules = schedules.filter((s) => {
    const employeeName = getScheduleEmployeeName(s);
    const status = normalizeScheduleStatus(s.status);
    if (search && !employeeName.toLowerCase().includes(search.toLowerCase())) return false;
    if (shiftFilter && s.shiftId !== shiftFilter) return false;
    if (statusFilter && status !== statusFilter) return false;
    return true;
  });

  const paginatedSchedules = filteredSchedules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const publishedCount = schedules.filter((s) => normalizeScheduleStatus(s.status) === 'PUBLISHED').length;
  const draftCount = schedules.filter((s) => normalizeScheduleStatus(s.status) === 'DRAFT').length;
  const totalAssigned = schedules.length;

  const columns = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (row: ScheduleItem) => (
        <div className="flex items-center gap-3">
          <Avatar name={getScheduleEmployeeName(row)} size="sm" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{getScheduleEmployeeName(row)}</p>
            {row.employeeCode && (
              <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'shiftName',
      header: 'Shift',
      render: (row: ScheduleItem) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{getScheduleShiftName(row)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row: ScheduleItem) => <span className="text-sm">{formatDate(row.date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ScheduleItem) => <StatusBadge status={normalizeScheduleStatus(row.status)} />,
    },
    {
      key: 'note',
      header: 'Note',
      render: (row: ScheduleItem) => (
        <span className="text-sm text-[var(--color-text-muted)]">{row.note || '-'}</span>
      ),
    },
  ];

  const handleAssignSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.employeeId || !assignForm.shiftId || !assignForm.date) return;
    await assignSchedule.mutateAsync(assignForm);
    setAssignModalOpen(false);
    setAssignForm({ employeeId: '', shiftId: '', date: '', note: '' });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishForm.startDate || !publishForm.endDate) return;
    await publishSchedule.mutateAsync(publishForm);
    setPublishModalOpen(false);
    setPublishForm({ startDate: '', endDate: '' });
  };

  return (
    <ManagerPageWrapper
      title="Schedules"
      subtitle="Manage shift assignments and schedule publishing"
      actions={
        <>
          <Button variant="secondary" onClick={() => setAssignModalOpen(true)} icon={Calendar}>Assign Shift</Button>
          <Button variant="primary" onClick={() => setPublishModalOpen(true)} icon={CheckCircle}>Publish</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Assigned" value={totalAssigned} subtext="Schedule entries" icon={Calendar} accent />
        <SummaryCard title="Published" value={publishedCount} subtext="Confirmed schedules" icon={CheckCircle} />
        <SummaryCard title="Drafts" value={draftCount} subtext="Pending publish" icon={Clock} />
        <SummaryCard title="Issues" value={0} subtext="Conflicts or errors" icon={AlertTriangle} />
      </div>

      <FilterBar className="mb-6">
        <FilterInput placeholder="Search employee..." value={search} onChange={setSearch} />
        <FilterDatePicker value={dateFrom} onChange={setDateFrom} />
        <FilterDatePicker value={dateTo} onChange={setDateTo} />
        <FilterSelect
          placeholder="Shift"
          value={shiftFilter}
          onChange={setShiftFilter}
          options={shifts.map((s) => ({ value: s.id, label: s.name }))}
        />
        <FilterSelect
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
          ]}
        />
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
              data={paginatedSchedules}
              emptyText="No schedules found"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredSchedules.length / pageSize))}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Shift"
        size="md"
        footer={
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="assign-schedule-form" icon={CheckCircle}>Assign</Button>
          </ModalFooter>
        }
      >
        <form id="assign-schedule-form" onSubmit={handleAssignSchedule} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Employee</span>
            <select
              required
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            >
              <option value="">Select employee</option>
              {employeeOptions.map((m) => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Shift</span>
            <select
              required
              value={assignForm.shiftId}
              onChange={(e) => setAssignForm((f) => ({ ...f, shiftId: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            >
              <option value="">Select shift</option>
              {shifts.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Date</span>
            <input
              required
              type="date"
              value={assignForm.date}
              onChange={(e) => setAssignForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Note (optional)</span>
            <input
              type="text"
              value={assignForm.note}
              onChange={(e) => setAssignForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Optional note"
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            />
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Schedules"
        size="md"
        footer={
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="publish-schedule-form" icon={CheckCircle}>Publish</Button>
          </ModalFooter>
        }
      >
        <form id="publish-schedule-form" onSubmit={handlePublish} className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Publish all draft schedules in the selected date range. Published schedules are visible to employees.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Start Date</span>
            <input
              required
              type="date"
              value={publishForm.startDate}
              onChange={(e) => setPublishForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">End Date</span>
            <input
              required
              type="date"
              value={publishForm.endDate}
              onChange={(e) => setPublishForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full h-11 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm"
            />
          </label>
        </form>
      </Modal>
    </ManagerPageWrapper>
  );
}
