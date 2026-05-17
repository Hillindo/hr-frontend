'use client';

import { useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { Tabs } from '@/components/ui/common';
import { Download, Eye, XCircle, Heart, Clock, FileCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeamLeaveRequests, useLeaveTypesAdmin } from '@/features/admin/hooks/useAdmin';
import { formatDate } from '@/lib/utils';

export default function TeamLeavePage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: leaveData, isLoading } = useTeamLeaveRequests({
    pageSize: 100,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: typesData } = useLeaveTypesAdmin();

  const leaveRequests = leaveData?.data ?? [];
  const leaveTypesList = typesData?.data ?? [];

  const filteredRequests = leaveRequests.filter((request) => {
    if (search && !request.employeeName.toLowerCase().includes(search.toLowerCase()) && !request.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && request.leaveTypeId !== typeFilter) return false;
    if (statusFilter && request.status !== statusFilter) return false;
    if (activeTab !== 'all' && request.status !== activeTab.toUpperCase()) return false;
    return true;
  });

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'REJECTED').length;
  const needsRevisionCount = leaveRequests.filter((r) => r.status === 'NEEDS_REVISION').length;

  const tabs = [
    { id: 'all', label: 'All Requests', count: leaveRequests.length },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
  ];

  const columns = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (row: typeof leaveRequests[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employeeName} size="sm" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.departmentName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'leaveTypeName',
      header: 'Leave Type',
      render: (row: typeof leaveRequests[0]) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.leaveTypeName}</span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (row: typeof leaveRequests[0]) => <span className="text-sm">{formatDate(row.startDate)}</span>,
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (row: typeof leaveRequests[0]) => <span className="text-sm">{formatDate(row.endDate)}</span>,
    },
    {
      key: 'daysCount',
      header: 'Days',
      sortable: true,
      render: (row: typeof leaveRequests[0]) => <span className="text-sm font-medium">{row.daysCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof leaveRequests[0]) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      render: (row: typeof leaveRequests[0]) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/leave/${row.id}`); }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
          title="View detail"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <ManagerPageWrapper
      title="Team Leave"
      subtitle="Manage leave requests from your team members"
      actions={<Button variant="secondary" icon={Download}>Export</Button>}
    >
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Pending Approval" value={pendingCount} subtext="Awaiting your action" icon={Clock} urgent={pendingCount > 0} />
        <SummaryCard title="Approved" value={approvedCount} subtext="This month" icon={FileCheck} />
        <SummaryCard title="Rejected" value={rejectedCount} subtext="This month" icon={XCircle} />
        <SummaryCard title="Needs Revision" value={needsRevisionCount} subtext="Awaiting revision" icon={Heart} urgent={needsRevisionCount > 0} />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <FilterBar className="mb-6">
          <FilterInput placeholder="Search employee or request ID..." value={search} onChange={setSearch} />
          <FilterSelect
            placeholder="Leave Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={leaveTypesList.map((t) => ({ value: t.id, label: t.name }))}
          />
          <FilterSelect
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'NEEDS_REVISION', label: 'Needs Revision' },
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
              <DataTable columns={columns} data={paginatedRequests} emptyText="No leave requests found" />
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(filteredRequests.length / pageSize))}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>
      </div>
    </ManagerPageWrapper>
  );
}