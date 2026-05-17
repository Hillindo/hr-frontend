'use client';

import { useState, use } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { useTeamLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest, useTenantLeaveBalances } from '@/features/admin/hooks/useAdmin';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  User,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { data: leaveData } = useTeamLeaveRequests({ pageSize: 500 });
  const leaveRequest = leaveData?.data?.find((r) => r.id === id);

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch leave balances for this employee
  const { data: balancesData } = useTenantLeaveBalances({ page: 1, pageSize: 100 });

  if (!leaveRequest) {
    return (
      <PageWrapper title="Leave Request Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Leave request not found</p>
          <Button variant="secondary" onClick={() => router.push('/leave')} className="mt-4">
            Back to Leave Requests
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const employeeName = leaveRequest.employeeName;
  const employeeDepartment = leaveRequest.departmentName;
  const isActionable = leaveRequest.status === 'SUBMITTED' || leaveRequest.status === 'PENDING';

  // Approval flow steps derived from actual status
  const approvalSteps = [
    { step: 1, name: 'Submitted', status: 'completed', completedAt: leaveRequest.submittedAt, actor: leaveRequest.employeeName },
    { step: 2, name: 'Manager Review', status: leaveRequest.status === 'PENDING' || leaveRequest.status === 'SUBMITTED' ? 'pending' : leaveRequest.status === 'APPROVED' ? 'completed' : leaveRequest.status === 'REJECTED' ? 'rejected' : 'completed', completedAt: leaveRequest.status !== 'PENDING' && leaveRequest.status !== 'SUBMITTED' ? leaveRequest.updatedAt : undefined, actor: leaveRequest.currentApproverName || 'Manager' },
  ];

  const employeeBalances = (balancesData?.data ?? []).filter(
    (b) => b.employeeId === leaveRequest.employeeId && b.leaveTypeId === leaveRequest.leaveTypeId
  );

  const handleAction = (action: 'approve' | 'reject' | 'revision') => {
    setConfirmAction(action);
    setRejectReason('');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      if (confirmAction === 'approve') {
        await approveMutation.mutateAsync(id);
        success('Request Approved', 'Leave request has been approved successfully.');
      } else if (confirmAction === 'reject') {
        await rejectMutation.mutateAsync({ id, reason: rejectReason || 'Rejected by admin' });
        success('Request Rejected', 'Leave request has been rejected.');
      } else if (confirmAction === 'revision') {
        success('Revision Requested', 'Employee has been notified to revise their request.');
      }
      setConfirmDialogOpen(false);
      router.push('/leave');
    } catch {
      showError('Action Failed', 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[var(--color-success)]';
      case 'pending': return 'bg-gray-300';
      case 'rejected': return 'bg-[var(--color-danger)]';
      case 'revision': return 'bg-[var(--color-warning)]';
      default: return 'bg-gray-300';
    }
  };

  return (
    <PageWrapper
      title="Leave Request Detail"
      subtitle={`Request ${leaveRequest.id}`}
    >
      <button
        onClick={() => router.push('/leave')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leave Requests
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar name={employeeName} size="xl" />
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{leaveRequest.employeeName}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">{leaveRequest.employeeCode}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={leaveRequest.status} />
                    <span className="text-sm text-[var(--color-text-muted)]">|</span>
                    <span className="px-2 py-1 bg-[var(--color-info-bg)] text-[var(--color-info)] text-xs rounded-lg">
                      {leaveRequest.leaveTypeName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--color-text-muted)]">Submitted</p>
                <p className="text-sm font-medium">{formatDateTime(leaveRequest.submittedAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--color-bg)] rounded-xl">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Start Date</p>
                <p className="text-sm font-medium">{formatDate(leaveRequest.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">End Date</p>
                <p className="text-sm font-medium">{formatDate(leaveRequest.endDate)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Total Days</p>
                <p className="text-sm font-medium">{leaveRequest.daysCount} {leaveRequest.daysCount === 1 ? 'day' : 'days'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Approver</p>
                <p className="text-sm font-medium">{leaveRequest.currentApproverName || 'Not assigned'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Request Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Leave Type</p>
                <p className="text-sm font-medium">{leaveRequest.leaveTypeName}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Date Range</p>
                <p className="text-sm font-medium">
                  {formatDate(leaveRequest.startDate)} - {formatDate(leaveRequest.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Duration</p>
                <p className="text-sm font-medium">
                  {leaveRequest.daysCount} {leaveRequest.daysCount === 1 ? 'day' : 'days'}
                </p>
              </div>
              {leaveRequest.reason && (
                <div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">Reason</p>
                  <p className="text-sm font-medium bg-[var(--color-bg)] p-3 rounded-xl">{leaveRequest.reason}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Approval Flow</h3>
            <div className="flex items-start justify-between">
              {approvalSteps.map((step, index) => (
                <div key={step.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white',
                      getStatusColor(step.status)
                    )}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : step.status === 'rejected' ? (
                        <XCircle className="w-5 h-5" />
                      ) : step.status === 'revision' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.step}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mt-2">{step.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{step.actor}</p>
                    {step.completedAt && (
                      <p className="text-xs text-[var(--color-text-muted)]">{formatDate(step.completedAt.split('T')[0])}</p>
                    )}
                  </div>
                  {index < approvalSteps.length - 1 && (
                    <div className={cn(
                      'w-20 h-1 mx-2 mt-[-20px]',
                      approvalSteps[index + 1].status !== 'pending' ? 'bg-[var(--color-success)]' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {isActionable && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Take Action</h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full bg-[var(--color-success)] hover:bg-green-700"
                  icon={CheckCircle}
                  onClick={() => handleAction('approve')}
                >
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  icon={XCircle}
                  onClick={() => handleAction('reject')}
                >
                  Reject Request
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Employee Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={employeeName} size="md" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{employeeName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{employeeDepartment}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Department</p>
                  <p className="text-sm font-medium">{employeeDepartment}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Approver</p>
                  <p className="text-sm font-medium">{leaveRequest.currentApproverName || 'Not assigned'}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                icon={User}
                onClick={() => router.push(`/employees/${leaveRequest.employeeId}`)}
              >
                View Full Profile
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Leave Balance</h3>
            {employeeBalances.length > 0 ? (
              <div className="space-y-3">
                {employeeBalances.map((b) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{b.leaveTypeName} ({b.year})</span>
                      <span className="text-sm font-semibold text-[var(--color-success)]">{b.remaining} days remaining</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-[var(--color-text-muted)]">Allocated: {b.allocated}</span>
                      <span className="text-[var(--color-text-muted)]">|</span>
                      <span className="text-[var(--color-warning)]">Used: {b.used}</span>
                      <span className="text-[var(--color-text-muted)]">|</span>
                      <span className="text-[var(--color-info)]">Pending: {b.pending}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[var(--color-success-bg)] rounded-xl">
                  <span className="text-sm text-[var(--color-success)]">Annual Leave</span>
                  <span className="text-sm font-semibold text-[var(--color-success)]">{leaveRequest.daysCount} days (requested)</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] text-center">No balance data available for this employee.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setConfirmAction(null); setRejectReason(''); }}
        onConfirm={handleConfirmAction}
        title={
          confirmAction === 'approve'
            ? 'Approve Leave Request'
            : confirmAction === 'reject'
            ? 'Reject Leave Request'
            : 'Request Revision'
        }
        description={
          confirmAction === 'approve'
            ? `Are you sure you want to approve ${leaveRequest.employeeName}'s leave request for ${leaveRequest.daysCount} days?`
            : confirmAction === 'reject'
            ? `Are you sure you want to reject ${leaveRequest.employeeName}'s leave request? This action cannot be undone.`
            : `Request ${leaveRequest.employeeName} to revise their leave request with additional information.`
        }
        confirmLabel={confirmAction === 'approve' ? 'Approve' : confirmAction === 'reject' ? 'Reject' : 'Request Revision'}
        cancelLabel="Cancel"
        variant={confirmAction === 'reject' ? 'danger' : confirmAction === 'revision' ? 'info' : 'warning'}
        isLoading={isProcessing}
      >
        {confirmAction === 'reject' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              rows={2}
              placeholder="Enter rejection reason..."
            />
          </div>
        )}
      </ConfirmDialog>
    </PageWrapper>
  );
}