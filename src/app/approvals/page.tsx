'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/common';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle, XCircle, RefreshCw, Eye, MessageSquare, RotateCcw } from 'lucide-react';
import { useApprovalInbox, useApprovalHistory, useApproveRequest, useRejectRequest, useRequestRevision } from '@/features/ess/hooks/useMyApprovals';
import type { ApprovalInboxItem } from '@/lib/api/ess';
import { toFrontendStatus } from '@/features/ess/utils/request-status';

export default function ApprovalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('inbox');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalInboxItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionRemarks, setRevisionRemarks] = useState('');

  // Fetch data from API hooks
  const { data: inboxData, isLoading: inboxLoading } = useApprovalInbox({
    page: 1,
    pageSize: 100,
    ...(filterType ? { status: filterType } : {}),
  });
  const { data: historyData, isLoading: historyLoading } = useApprovalHistory({
    page: 1,
    pageSize: 100,
    ...(filterStatus ? { status: filterStatus } : {}),
  });

  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const requestRevision = useRequestRevision();

  // Get data based on active tab
  const rawData = activeTab === 'inbox' ? inboxData?.data : historyData?.data;
  const requests = rawData || [];
  const isLoading = activeTab === 'inbox' ? inboxLoading : historyLoading;

  // Stats based on actual data
  const pendingCount = requests.filter((r: ApprovalInboxItem) => r.status === 'PENDING').length;
  const approvedToday = requests.filter((r: ApprovalInboxItem) => r.status === 'APPROVED').length;
  const rejectedToday = requests.filter((r: ApprovalInboxItem) => r.status === 'REJECTED').length;
  const needsRevisionCount = requests.filter((r: ApprovalInboxItem) => r.status === 'NEEDS_REVISION').length;

  // Filter
  const filteredRequests = requests.filter((request: ApprovalInboxItem) => {
    if (activeTab === 'inbox' && request.status !== 'PENDING') return false;
    if (search && !request.requesterName.toLowerCase().includes(search.toLowerCase()) &&
        !request.requestId?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterType && request.requestType !== filterType) return false;
    if (filterStatus && request.status !== filterStatus) return false;
    return true;
  });

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

  const handleRevisionClick = (request: ApprovalInboxItem) => {
    setSelectedRequest(request);
    setRevisionRemarks('');
    setRevisionModalOpen(true);
  };

  const handleRevisionConfirm = async () => {
    if (!selectedRequest) return;
    await requestRevision.mutateAsync({ id: selectedRequest.id, payload: { remarks: revisionRemarks } });
    setRevisionModalOpen(false);
    setSelectedRequest(null);
    setRevisionRemarks('');
  };

  const handleExport = () => {
    // TODO: Implement actual export functionality
    console.log('Exporting approvals...');
  };

  const columns = [
    {
      key: 'requestId',
      header: 'Request ID',
      render: (row: ApprovalInboxItem) => (
        <span className="font-mono text-sm text-[var(--color-text-muted)]">{row.requestId}</span>
      ),
    },
    {
      key: 'entityType',
      header: 'Type',
      sortable: true,
      render: (row: ApprovalInboxItem) => {
        const typeLabels: Record<string, string> = {
          LEAVE_REQUEST: 'Leave',
          ATTENDANCE_CORRECTION: 'Attendance',
          PROFILE_CHANGE: 'Profile',
        };
        return (
          <span className="px-2 py-1 bg-[var(--color-bg)] rounded-lg text-xs font-medium">
            {typeLabels[row.requestType] || row.requestType}
          </span>
        );
      },
    },
    {
      key: 'requesterName',
      header: 'Requester',
      sortable: true,
      render: (row: ApprovalInboxItem) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.requesterName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.requesterDepartment}</p>
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (row: ApprovalInboxItem) => formatDateTime(row.requestDate),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: ApprovalInboxItem) => <StatusBadge status={toFrontendStatus(row.status)} />,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-48',
      render: (row: ApprovalInboxItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/approvals/${row.id}`);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
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
              <Button size="sm" variant="ghost" onClick={() => handleRevisionClick(row)}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Request Revision
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'inbox', label: 'Inbox', count: pendingCount },
    { id: 'history', label: 'History' },
  ];

  return (
    <PageWrapper
      title="Approval Inbox"
      subtitle="Review and process pending requests"
      actions={
        <>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export
          </Button>
        </>
      }
    >
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-warning)]">{pendingCount}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-success)]">{approvedToday}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Approved Today</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-danger)]">{rejectedToday}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Rejected Today</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-warning)]">{needsRevisionCount}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Needs Revision</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <FilterBar className="mb-6">
          <FilterInput
            placeholder="Search requester or ID..."
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            placeholder="Request Type"
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'LEAVE_REQUEST', label: 'Leave Request' },
              { value: 'ATTENDANCE_CORRECTION', label: 'Attendance Correction' },
              { value: 'PROFILE_CHANGE', label: 'Profile Change' },
            ]}
          />
          {activeTab === 'history' && (
            <FilterSelect
              placeholder="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'NEEDS_REVISION', label: 'Needs Revision' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          )}
        </FilterBar>

        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredRequests}
            onRowClick={(row) => router.push(`/approvals/${row.id}`)}
          />
        </div>
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

      {/* Reject Confirmation Modal */}
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

      {/* Request Revision Modal */}
      <Modal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        title="Request Revision"
        size="sm"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRevisionConfirm} disabled={requestRevision.isPending}>
              {requestRevision.isPending ? 'Requesting...' : 'Request Revision'}
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Provide remarks for the requester to revise their submission for <strong>{selectedRequest?.summary}</strong>.
          </p>
          <textarea
            className="w-full p-3 border border-[var(--color-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={4}
            placeholder="Enter revision remarks..."
            value={revisionRemarks}
            onChange={(e) => setRevisionRemarks(e.target.value)}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}