'use client';

import { useState } from 'react';
import { EmployeePageWrapper } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/common';
import { Pagination } from '@/components/ui/pagination';
import { useMyRequests } from '@/features/ess/hooks/useMyRequests';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react';
import type { UnifiedRequestItem } from '@/lib/api/ess';
import type { ListQueryParams } from '@/lib/types/api';

const DEFAULT_PAGE_SIZE = 20;

const requestTypeLabels: Record<string, string> = {
  LEAVE: 'Leave',
  ATTENDANCE_CORRECTION: 'Attendance Correction',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'leave', label: 'Leave' },
  { value: 'correction', label: 'Attendance Correction' },
];

function getRequestSummary(request: UnifiedRequestItem): string {
  if (request.requestType === 'LEAVE' && request.details) {
    const d = request.details;
    const leaveType = d.leaveType || 'Leave';
    const startDate = d.startDate || '';
    const endDate = d.endDate || '';
    if (startDate && endDate) {
      return `${leaveType} (${startDate} to ${endDate})`;
    }
    return leaveType;
  }
  if (request.requestType === 'ATTENDANCE_CORRECTION' && request.details) {
    const d = request.details;
    return `Attendance Correction for ${d.correctionDate || 'N/A'}`;
  }
  return request.requestType;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'SUBMITTED':
    case 'PENDING':
      return <Clock className="w-5 h-5 text-[var(--color-warning)]" />;
    case 'APPROVED':
      return <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />;
    case 'REJECTED':
      return <XCircle className="w-5 h-5 text-[var(--color-danger)]" />;
    default:
      return null;
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'SUBMITTED':
    case 'PENDING':
    case 'NEEDS_REVISION':
      return 'warning';
    default:
      return 'neutral';
  }
}

export default function MyRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const queryParams: ListQueryParams = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status: status || undefined,
    type: type || undefined,
  };

  const { data, isLoading, isError } = useMyRequests(queryParams);

  const requests = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  const handleFilterChange = (newStatus: string, newType: string) => {
    setStatus(newStatus);
    setType(newType);
    setPage(1); // reset to first page when filters change
  };

  if (isLoading) {
    return (
      <EmployeePageWrapper title="My Requests" subtitle="Track all your submitted requests">
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </Card>
      </EmployeePageWrapper>
    );
  }

  if (isError) {
    return (
      <EmployeePageWrapper title="My Requests" subtitle="Track all your submitted requests">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Failed to load requests. Please try again.</p>
        </Card>
      </EmployeePageWrapper>
    );
  }

  return (
    <EmployeePageWrapper
      title="My Requests"
      subtitle="Track all your submitted requests"
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-[var(--color-text-secondary)]">Status:</label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) => handleFilterChange(e.target.value, type)}
                className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className="text-sm text-[var(--color-text-secondary)]">Type:</label>
              <select
                id="type-filter"
                value={type}
                onChange={(e) => handleFilterChange(status, e.target.value)}
                className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm bg-white"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {meta && (
              <span className="text-sm text-[var(--color-text-muted)] ml-auto">
                {meta.total} request{meta.total !== 1 ? 's' : ''} total
              </span>
            )}
          </div>
        </Card>

        {requests.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<Clock className="w-12 h-12" />}
              title="No requests found"
              description="You haven't submitted any requests yet, or no requests match your filters."
            />
          </Card>
        ) : (
          <>
            {requests.map((request) => (
              <Card key={request.requestId} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info">{requestTypeLabels[request.requestType] || request.requestType}</Badge>
                      </div>
                      <p className="font-semibold text-[var(--color-text-primary)]">{getRequestSummary(request)}</p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Submitted: {formatDate(request.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={request.status} />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{request.requestId}</p>
                  </div>
                </div>
                {request.currentApprover && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Current Approver: <span className="font-medium text-[var(--color-text-secondary)]">{request.currentApprover}</span>
                    </p>
                  </div>
                )}
                {request.lastAction && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    {request.lastAction}
                  </p>
                )}
              </Card>
            ))}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </EmployeePageWrapper>
  );
}
