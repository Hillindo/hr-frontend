'use client';

import { use, useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Building,
  Users,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useApprovalDetail, useApproveRequest, useRejectRequest, useRequestRevision } from '@/features/ess/hooks/useMyApprovals';
import type { ApprovalRequestDetailDto } from '@/lib/api/ess';
import { toFrontendStatus } from '@/features/ess/utils/request-status';

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [remarks, setRemarks] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch approval detail
  const { data: approvalData, isLoading, isError } = useApprovalDetail(id);
  const approval = approvalData?.data as ApprovalRequestDetailDto | undefined;
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const requestRevision = useRequestRevision();

  if (isLoading) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Loading approval details...</p>
        </div>
      </PageWrapper>
    );
  }

  if (isError || !approval) {
    return (
      <PageWrapper title="Approval Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Approval request not found</p>
          <Button variant="secondary" onClick={() => router.push('/approvals')} className="mt-4">
            Back to Approvals
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const isPending = approval.finalStatus === 'PENDING';
  const isApproved = approval.finalStatus === 'APPROVED';
  const isRejected = approval.finalStatus === 'REJECTED';
  const needsRevision = approval.finalStatus === 'NEEDS_REVISION';

  // Get request type label
  const typeLabels: Record<string, string> = {
    LEAVE_REQUEST: 'Leave Request',
    ATTENDANCE_CORRECTION: 'Attendance Correction',
    PROFILE_CHANGE: 'Profile Change',
  };

  // Status badge color for header
  const statusStyles: Record<string, { badge: string; text: string; bg: string }> = {
    PENDING: { badge: 'warning', text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-bg)]' },
    APPROVED: { badge: 'success', text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-bg)]' },
    REJECTED: { badge: 'danger', text: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-bg)]' },
    NEEDS_REVISION: { badge: 'warning', text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-bg)]' },
  };

  const style = statusStyles[approval.finalStatus] || statusStyles.PENDING;

  const handleApprove = async () => {
    await approveRequest.mutateAsync({ id: approval.id, payload: { note: remarks } });
    router.push('/approvals');
  };

  const handleRejectClick = () => {
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    await rejectRequest.mutateAsync({ id: approval.id, payload: { reason: rejectReason } });
    setRejectModalOpen(false);
    router.push('/approvals');
  };

  const handleRevisionClick = () => {
    setRevisionModalOpen(true);
  };

  const handleRevisionConfirm = async () => {
    await requestRevision.mutateAsync({ id: approval.id, payload: { remarks } });
    setRevisionModalOpen(false);
    router.push('/approvals');
  };

  return (
    <PageWrapper
      title="Approval Detail"
      actions={
        <>
          <Button variant="secondary" icon={FileText}>
            Print
          </Button>
        </>
      }
    >
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/approvals')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Approvals
      </button>

      {/* Header Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-[var(--color-bg)] rounded-lg text-sm font-medium">
                {typeLabels[approval.entityType] || approval.entityType}
              </span>
              <StatusBadge status={toFrontendStatus(approval.finalStatus)} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
              {approval.subject}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Request ID: <span className="font-mono">{approval.id}</span>
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Submitted: {formatDateTime(approval.submittedAt)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1 - Request Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Request Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={approval.requesterEmployeeName} size="md" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{approval.requesterEmployeeName}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Employee</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Request Type</p>
                  <p className="text-sm font-medium">{typeLabels[approval.entityType] || approval.entityType}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Submitted At</p>
                  <p className="text-sm font-medium">{formatDateTime(approval.submittedAt)}</p>
                </div>
              </div>
            </div>

            {approval.description && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-muted)]">Description</p>
                <p className="text-sm font-medium mt-1 p-3 bg-[var(--color-bg)] rounded-xl">
                  {approval.description}
                </p>
              </div>
            )}
          </Card>

          {/* Section 2 - Approval Flow / Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Approval Flow</h3>
            <div className="space-y-0">
              {approval.steps?.map((step, index) => {
                const isCompleted = step.status === 'APPROVED';
                const isCurrent = step.status === 'PENDING';
                const isPendingStep = step.status === 'PENDING' && index === approval.steps?.findIndex(s => s.status === 'PENDING');

                return (
                  <div key={step.id} className="flex items-start gap-4 relative">
                    {/* Timeline connector */}
                    {index < approval.steps.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-12 ${isCompleted ? 'bg-[var(--color-success)]' : 'bg-gray-200'}`} />
                    )}

                    {/* Step indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      isCompleted ? 'bg-[var(--color-success)] text-white' :
                      isCurrent ? 'bg-[var(--color-accent)] text-[var(--color-primary)]' :
                      'bg-gray-100 text-[var(--color-text-muted)]'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.stepOrder}</span>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${
                          isCompleted || isCurrent ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                        }`}>
                          Step {step.stepOrder}: {step.approverEmployeeName}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success)] text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      {step.actionDate && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {formatDateTime(step.actionDate)}
                        </p>
                      )}
                      {step.remarks && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                          Remarks: {step.remarks}
                        </p>
                      )}
                      {!step.actionDate && isPendingStep && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 italic">
                          Waiting...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {/* Decision Panel - only show if pending */}
          {isPending && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Your Decision</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Remarks / Notes
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add your remarks or notes here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="accent"
                    className="w-full"
                    icon={CheckCircle}
                    onClick={handleApprove}
                    disabled={approveRequest.isPending}
                  >
                    {approveRequest.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                    icon={XCircle}
                    onClick={handleRejectClick}
                    disabled={rejectRequest.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    icon={RefreshCw}
                    onClick={handleRevisionClick}
                  >
                    Request Revision
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Status summary for non-pending */}
          {(isApproved || isRejected || needsRevision) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Resolution</h3>
              <div className={`p-4 rounded-xl ${style.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isApproved && <CheckCircle className={`w-5 h-5 ${style.text}`} />}
                  {isRejected && <XCircle className={`w-5 h-5 ${style.text}`} />}
                  {needsRevision && <AlertCircle className={`w-5 h-5 ${style.text}`} />}
                  <p className={`font-semibold ${style.text}`}>
                    {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Needs Revision'}
                  </p>
                </div>
                {approval.resolvedAt && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatDateTime(approval.resolvedAt)}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Request Info Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Request Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Request ID</span>
                <span className="text-sm font-medium font-mono">{approval.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Request Type</span>
                <span className="text-sm font-medium">{typeLabels[approval.entityType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Submitted</span>
                <span className="text-sm font-medium">{formatDate(approval.submittedAt)}</span>
              </div>
              {approval.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Resolved</span>
                  <span className="text-sm font-medium">{formatDate(approval.resolvedAt)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Actions Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" icon={FileText}>
                Print / Export PDF
              </Button>
              <Button variant="secondary" className="w-full" icon={ArrowLeft} onClick={() => router.push('/approvals')}>
                Back to Inbox
              </Button>
            </div>
          </Card>
        </div>
      </div>

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
            Please provide a reason for rejecting this request.
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

      {/* Revision Modal */}
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
            Provide remarks for the requester to revise their submission.
          </p>
          <textarea
            className="w-full p-3 border border-[var(--color-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={4}
            placeholder="Enter revision remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}