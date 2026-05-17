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
import { Modal, ModalFooter } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle, XCircle, Clock, RotateCcw, Eye } from 'lucide-react';
import { useApprovalInbox, useApproveRequest, useRejectRequest } from '@/features/ess/hooks/useMyApprovals';
import type { ApprovalInboxItem } from '@/lib/api/ess';
import { toFrontendStatus } from '@/features/ess/utils/request-status';

export default function ManagerApprovalsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('pending');

  // Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalInboxItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter] = useState('');

  // Fetch data from API
  const { data: inboxData, isLoading } = useApprovalInbox({
    page: currentPage,
    pageSize: 100,
    ...(typeFilter ? { status: typeFilter } : {}),
  });

  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const requests = inboxData?.data || [];
  const totalCount = inboxData?.meta?.total || 0;

  // Apply filters
  const filteredRequests = requests.filter((request: ApprovalInboxItem) => {
    if (search && !request.requesterName.toLowerCase().includes(search.toLowerCase()) &&
        !request.requestId?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && request.requestType !== typeFilter) return false;
    return true;
  });

  // Tab filtering
  const today = new Date().toISOString().split('T')[0];
  const tabFilteredRequests = filteredRequests.filter((r: ApprovalInboxItem) => {
    if (activeTab === 'pending') return r.status === 'PENDING';
    if (activeTab === 'approved_today') return r.status === 'APPROVED';
    if (activeTab === 'rejected_today') return r.status === 'REJECTED';
    if (activeTab === 'history') return true;
    return true;
  });

  const paginatedRequests = tabFilteredRequests.slice(0, pageSize);

  // Calculate KPIs
  const pendingCount = requests.filter((r: ApprovalInboxItem) => r.status === 'PENDING').length;
  const approvedToday = requests.filter(
    (r: ApprovalInboxItem) => r.status === 'APPROVED'
  ).length;
  const rejectedToday = requests.filter(
    (r: ApprovalInboxItem) => r.status === 'REJECTED'
  ).length;
  const needsRevisionCount = requests.filter((r: ApprovalInboxItem) => r.status === 'NEEDS_REVISION').length;

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'approved_today', label: 'Approved Today', count: approvedToday },
    { id: 'rejected_today', label: 'Rejected Today', count: rejectedToday },
    { id: 'history', label: 'History' },
  ];

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST': return 'Leave Request';
      case 'ATTENDANCE_CORRECTION': return 'Attendance';
      case 'PROFILE_CHANGE': return 'Profile Change';
      default: return type;
    }
  };

  const handleApproveClick = (request: ApprovalInboxItem) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;
    await approveRequest.mutateAsync({ id: selectedRequest.id });
    setApproveModalOpen(false);
    setSelectedRequest(null);
  };

  const handleRejectClick = (request: ApprovalInboxItem) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    await rejectRequest.mutateAsync({ id: selectedRequest.id, payload: { reason: rejectReason } });
    setRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const handleExport = () => {
    console.log('Exporting approvals...');
  };

  const columns = [
    {
      key: 'requestType',
      header: 'Request Type',
      render: (row: ApprovalInboxItem) => (
        <span className="px-2 py-1 bg-[var(--color-bg)] rounded-lg text-xs font-medium">
          {getRequestTypeLabel(row.requestType)}
        </span>
      ),
    },
    {
      key: 'requester',
      header: 'Requester',
      sortable: true,
      render: (row: ApprovalInboxItem) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.requesterName} size="sm" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.requesterName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.requesterDepartment}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'requestDate',
      header: 'Submitted',
      sortable: true,
      render: (row: ApprovalInboxItem) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {formatDate(row.requestDate.split('T')[0])}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ApprovalInboxItem) => <StatusBadge status={toFrontendStatus(row.status)} />,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-64',
      render: (row: ApprovalInboxItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/approvals/${row.id}`);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
            title="View detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'PENDING' && (
            <>
              <Button size="sm" variant="ghost" className="text-[var(--color-success)] hover:bg-[var(--color-success-bg)]" onClick={() => handleApproveClick(row)}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" onClick={() => handleRejectClick(row)}>
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <ManagerPageWrapper
      title="Approval Inbox"
      subtitle="Review and process pending requests from your team"
      actions={
        <>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export
          </Button>
        </>
      }
    >
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Pending"
          value={pendingCount}
          subtext="Awaiting your action"
          icon={Clock}
          urgent={pendingCount > 0}
        />
        <SummaryCard
          title="Approved Today"
          value={approvedToday}
          subtext="Processed today"
          icon={CheckCircle}
        />
        <SummaryCard
          title="Rejected Today"
          value={rejectedToday}
          subtext="Processed today"
          icon={XCircle}
        />
        <SummaryCard
          title="Needs Revision"
          value={needsRevisionCount}
          subtext="Awaiting revision"
          icon={RotateCcw}
          urgent={needsRevisionCount > 0}
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {/* Filters */}
        <FilterBar className="mb-6">
          <FilterInput
            placeholder="Search requester or ID..."
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            placeholder="Request Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'LEAVE_REQUEST', label: 'Leave Request' },
              { value: 'ATTENDANCE_CORRECTION', label: 'Attendance Correction' },
            ]}
          />
        </FilterBar>

        {/* Table */}
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={paginatedRequests}
            emptyText="No approval requests found"
          />
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(tabFilteredRequests.length / pageSize)}
            onPageChange={setCurrentPage}
          />
        </Card>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Request"
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveConfirm}
              disabled={approveRequest.isPending}
            >
              {approveRequest.isPending ? 'Approving...' : 'Approve Request'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to approve the request from <strong>{selectedRequest?.requesterName}</strong>?
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Summary: {selectedRequest?.summary}
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Request"
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectRequest.isPending}
            >
              {rejectRequest.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Please provide a reason for rejecting the request from <strong>{selectedRequest?.requesterName}</strong>.
          </p>
          <textarea
            className="w-full p-3 border border-[var(--color-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={4}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </ManagerPageWrapper>
  );
}

