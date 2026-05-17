'use client';

import { useState, useMemo } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/common';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Download, Plus, Calendar, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import {
  useTenantLeaveRequests,
  useTenantLeaveBalances,
  useLeaveTypesAdmin,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '@/features/admin/hooks/useAdmin';
import { useToast } from '@/components/ui/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const ALL_STATUSES = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NEEDS_REVISION', label: 'Needs Revision' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function LeavePage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: leaveData, isLoading } = useTenantLeaveRequests({
    page: currentPage,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const { data: balancesData, isLoading: balancesLoading } = useTenantLeaveBalances({
    page: 1,
    pageSize: 100,
  });
  const { data: typesData } = useLeaveTypesAdmin();

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();

  const leaveRequestsList = leaveData?.data ?? [];
  const leaveTypesList = typesData?.data ?? [];
  const balancesList = balancesData?.data ?? [];

  const filteredRequests = useMemo(() => {
    return leaveRequestsList.filter((request) => {
      if (search && !request.employeeName.toLowerCase().includes(search.toLowerCase()) && !request.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && request.leaveTypeId !== typeFilter) return false;
      return true;
    });
  }, [leaveRequestsList, search, typeFilter]);

  const summaryCounts = useMemo(() => {
    const counts = {
      total: leaveRequestsList.length,
      submitted: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      needsRevision: 0,
      cancelled: 0,
    };
    for (const r of leaveRequestsList) {
      const s = r.status?.toUpperCase();
      if (s === 'SUBMITTED') counts.submitted++;
      else if (s === 'PENDING') counts.pending++;
      else if (s === 'APPROVED') counts.approved++;
      else if (s === 'REJECTED') counts.rejected++;
      else if (s === 'NEEDS_REVISION') counts.needsRevision++;
      else if (s === 'CANCELLED') counts.cancelled++;
    }
    return counts;
  }, [leaveRequestsList]);

  const totalPages = leaveData?.meta?.totalPages ?? Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approveMutation.mutateAsync(approveTarget.id);
      success('Request Approved', `Leave request for ${approveTarget.name} has been approved.`);
    } catch {
      showError('Approval Failed', 'Failed to approve leave request. Please try again.');
    } finally {
      setApproveDialogOpen(false);
      setApproveTarget(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason: rejectReason || 'Rejected by admin' });
      success('Request Rejected', `Leave request for ${rejectTarget.name} has been rejected.`);
    } catch {
      showError('Rejection Failed', 'Failed to reject leave request. Please try again.');
    } finally {
      setRejectDialogOpen(false);
      setRejectTarget(null);
      setRejectReason('');
    }
  };

  const paginatedRequests = filteredRequests;

  const requestColumns = [
    {
      key: 'employeeName', header: 'Employee', sortable: true,
      render: (row: typeof leaveRequestsList[0]) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.departmentName}</p>
        </div>
      ),
    },
    { key: 'leaveTypeName', header: 'Leave Type', sortable: true },
    { key: 'startDate', header: 'Start Date', sortable: true, render: (row: typeof leaveRequestsList[0]) => formatDate(row.startDate) },
    { key: 'endDate', header: 'End Date', render: (row: typeof leaveRequestsList[0]) => formatDate(row.endDate) },
    { key: 'daysCount', header: 'Days', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (row: typeof leaveRequestsList[0]) => <StatusBadge status={row.status} /> },
    { key: 'currentApproverName', header: 'Approver', render: (row: typeof leaveRequestsList[0]) => row.currentApproverName || '-' },
    {
      key: 'actions', header: '', width: 'w-40',
      render: (row: typeof leaveRequestsList[0]) => {
        const isActionable = row.status === 'SUBMITTED' || row.status === 'PENDING';
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => router.push(`/leave/${row.id}`)}
              className="px-2 py-1 text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-info-bg)] rounded-lg transition-colors"
            >
              View
            </button>
            {isActionable && (
              <>
                <button
                  onClick={() => { setApproveTarget({ id: row.id, name: row.employeeName }); setApproveDialogOpen(true); }}
                  className="px-2 py-1 text-xs font-medium text-[var(--color-success)] hover:bg-green-50 rounded-lg transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setRejectTarget({ id: row.id, name: row.employeeName }); setRejectDialogOpen(true); }}
                  className="px-2 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-red-50 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tabs = [
    { id: 'requests', label: 'Leave Requests', count: leaveData?.meta?.total ?? leaveRequestsList.length },
    { id: 'balances', label: 'Leave Balances' },
  ];

  return (
    <PageWrapper
      title="Leave Management"
      subtitle="Manage leave requests, balances, and statuses"
      actions={
        <>
          <Button variant="secondary" icon={Download}>Export Report</Button>
          <Button icon={Plus} onClick={() => router.push('/leave/new')}>Create Leave Request</Button>
        </>
      }
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'requests'}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <SummaryCard title="Total" value={summaryCounts.total} subtext="All requests" icon={Calendar} />
            <SummaryCard title="Pending" value={summaryCounts.pending} subtext="Awaiting action" icon={Clock} urgent={summaryCounts.pending > 0} />
            <SummaryCard title="Submitted" value={summaryCounts.submitted} subtext="New requests" icon={FileText} />
            <SummaryCard title="Approved" value={summaryCounts.approved} subtext="All time" icon={CheckCircle} />
            <SummaryCard title="Rejected" value={summaryCounts.rejected} subtext="All time" icon={XCircle} />
            <SummaryCard title="Cancelled" value={summaryCounts.cancelled} subtext="All time" icon={Calendar} />
          </div>

          <FilterBar className="mb-6">
            <FilterInput placeholder="Search employee or request ID..." value={search} onChange={setSearch} />
            <FilterSelect placeholder="Leave Type" value={typeFilter} onChange={setTypeFilter} options={leaveTypesList.map((t) => ({ value: t.id, label: t.name }))} />
            <FilterSelect placeholder="Status" value={statusFilter} onChange={setStatusFilter} options={ALL_STATUSES} />
          </FilterBar>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" /></div>
            ) : (
              <>
                <DataTable columns={requestColumns} data={paginatedRequests} onRowClick={(row) => router.push(`/leave/${row.id}`)} emptyText="No leave requests found" />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'balances'}>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            {balancesLoading ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" /></div>
            ) : balancesList.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-[var(--color-text-muted)]">No leave balances found. Balances are created when leave types are assigned to employees.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--color-bg)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Leave Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Year</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Allocated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Used</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Pending</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balancesList.map((b) => (
                      <tr key={b.id} className="border-b border-[var(--color-border)] hover:bg-gray-50/30">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">{b.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{b.leaveTypeName}</td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{b.year}</td>
                        <td className="px-4 py-3 text-sm text-right text-[var(--color-text-secondary)]">{b.allocated}</td>
                        <td className="px-4 py-3 text-sm text-right text-[var(--color-warning)]">{b.used}</td>
                        <td className="px-4 py-3 text-sm text-right text-[var(--color-info)]">{b.pending}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--color-success)]">{b.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      <ConfirmDialog
        isOpen={approveDialogOpen}
        onClose={() => { setApproveDialogOpen(false); setApproveTarget(null); }}
        onConfirm={handleApprove}
        title="Approve Leave Request"
        description={approveTarget ? `Are you sure you want to approve ${approveTarget.name}'s leave request?` : ''}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={approveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={rejectDialogOpen}
        onClose={() => { setRejectDialogOpen(false); setRejectTarget(null); setRejectReason(''); }}
        onConfirm={handleReject}
        title="Reject Leave Request"
        description={rejectTarget ? `Are you sure you want to reject ${rejectTarget.name}'s leave request? This action cannot be undone.` : ''}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={rejectMutation.isPending}
      >
        <div className="mt-3">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Reason (optional)</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            rows={2}
            placeholder="Enter rejection reason..."
          />
        </div>
      </ConfirmDialog>
    </PageWrapper>
  );
}