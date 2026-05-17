'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { EmployeePageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/common';
import { Tabs, TabPanel } from '@/components/ui/common';
import { useAuth } from '@/lib/auth/auth-context';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterSelect } from '@/components/ui/filter-bar';
import { useMyLeaveTypes, useMyLeaveBalances, useMyLeaveRequests, useCreateLeaveRequest, useCancelLeaveRequest } from '@/features/ess/api';
import { formatDate } from '@/lib/utils';
import { Plus, Heart, Calendar, CheckCircle, Clock, Thermometer, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('balance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const reasonTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the reason textarea when the modal opens
  useEffect(() => {
    if (isModalOpen && reasonTextareaRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        reasonTextareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // API hooks
  const { data: leaveTypesData } = useMyLeaveTypes();
  const { data: balancesData } = useMyLeaveBalances();
  const { data: requestsData, isLoading: requestsLoading } = useMyLeaveRequests({
  status: statusFilter !== 'ALL' ? statusFilter : undefined,
});
  const createRequest = useCreateLeaveRequest();
  const cancelRequest = useCancelLeaveRequest();

  const leaveTypes = leaveTypesData?.data || [];
  const balances = balancesData?.data || [];
  const requests = requestsData?.data || [];

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalAllocated = balances.reduce((sum, b) => sum + b.totalDays, 0);
    const totalUsed = balances.reduce((sum, b) => sum + b.usedDays, 0);
    const totalRemaining = balances.reduce((sum, b) => sum + b.availableDays, 0);
    const pendingCount = requests.filter((r) => r.status === 'PENDING' || r.status === 'SUBMITTED').length;
    return { totalAllocated, totalUsed, totalRemaining, pendingCount };
  }, [balances, requests]);

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING' || r.status === 'SUBMITTED');
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');

  const tabs = [
    { id: 'balance', label: 'My Balance' },
    { id: 'requests', label: 'My Requests', count: summaryStats.pendingCount },
  ];

  // Calculate days count from dates
  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, [startDate, endDate]);

  const handleSubmitRequest = async () => {
    if (!selectedLeaveTypeId || !startDate || !endDate) return;

    try {
      await createRequest.mutateAsync({
        leaveTypeId: selectedLeaveTypeId,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      // Reset form and close modal
      setSelectedLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create leave request:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await cancelRequest.mutateAsync(requestId);
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
    }
  };

  const resetForm = () => {
    setSelectedLeaveTypeId('');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const isFormValid = selectedLeaveTypeId && startDate && endDate && daysCount > 0;
  const leaveTypeOptions = leaveTypes.map((lt) => ({ value: lt.id, label: lt.name }));

  return (
    <EmployeePageWrapper
      title="My Leave"
      subtitle="Manage your leave balances and requests"
      actions={
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Submit Request
        </Button>
      }
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'balance'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Annual Leave Remaining */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-success-bg)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Annual Leave Remaining</p>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">{summaryStats.totalRemaining}</span>
                <span className="text-[var(--color-text-muted)]"> / {summaryStats.totalAllocated} days</span>
              </div>
              <ProgressBar
                value={summaryStats.totalUsed}
                max={summaryStats.totalAllocated}
                showPercentage={false}
                size="sm"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">of {summaryStats.totalAllocated} days allocated</p>
            </Card>

            {/* Sick Leave Used */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Sick Leave Used</p>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">{summaryStats.totalUsed}</span>
                <span className="text-[var(--color-text-muted)]"> days</span>
              </div>
              {(() => {
                const sickBalance = balances.find(b => b.leaveTypeCode === 'SICK' || b.leaveTypeCode === 'ANNUAL');
                if (sickBalance) {
                  return <ProgressBar value={sickBalance.usedDays} max={sickBalance.totalDays} showPercentage={false} size="sm" />;
                }
                return <ProgressBar value={summaryStats.totalUsed} max={summaryStats.totalAllocated} showPercentage={false} size="sm" />;
              })()}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">used this year</p>
            </Card>

            {/* Pending Requests */}
            <Card className="p-6 border-[var(--color-warning)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Pending Requests</p>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-[var(--color-warning)]">{summaryStats.pendingCount}</span>
                <span className="text-[var(--color-text-muted)]"> request(s)</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">awaiting manager approval</p>
            </Card>
          </div>

          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((balance) => (
              <Card key={balance.leaveTypeId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-info-bg)] flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[var(--color-info)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{balance.leaveTypeName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{balance.leaveTypeCode}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-[var(--color-text-primary)]">{balance.availableDays}</span>
                  <span className="text-[var(--color-text-muted)]"> / {balance.totalDays} days</span>
                </div>
                <ProgressBar value={balance.availableDays} max={balance.totalDays} showPercentage={false} />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-[var(--color-text-muted)]">Used: {balance.usedDays}</span>
                  <span className="text-[var(--color-warning)]">Pending: {balance.pendingDays}</span>
                </div>
              </Card>
            ))}
            {balances.length === 0 && (
              <Card className="p-6 col-span-full text-center">
                <p className="text-[var(--color-text-muted)]">No leave balance available</p>
              </Card>
            )}
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'requests'}>
          {/* Status Filter */}
          <div className="mb-4">
            <FilterSelect
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Requests' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              className="w-48"
            />
          </div>

          {/* Requests List */}
          {requestsLoading ? (
            <Card className="p-6 text-center">
              <p className="text-[var(--color-text-muted)]">Loading requests...</p>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-[var(--color-text-muted)]">No leave requests found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">{request.leaveTypeName}</p>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)} ({request.totalDays} day{request.totalDays !== 1 ? 's' : ''})
                        </p>
                        {request.reason && (
                          <p className="text-sm text-[var(--color-text-muted)] mt-1">Reason: {request.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} />
                      {(request.status === 'PENDING' || request.status === 'SUBMITTED') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={X}
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelRequest.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {request.id} &bull; Submitted {formatDate(request.createdAt)}
                    </p>
                    {request.currentApproverName && (
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Approver: <span className="font-medium text-[var(--color-text-secondary)]">{request.currentApproverName}</span>
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Grouped view when "All" filter is selected */}
          {!requestsLoading && statusFilter === 'ALL' && filteredRequests.length > 0 && pendingRequests.length > 0 && (
            <div className="mt-6">
              <Card className="p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Pending Requests</h3>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-[var(--color-warning-bg)] rounded-xl">
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{request.leaveTypeName}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)} ({request.totalDays} days)
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              </Card>

              {approvedRequests.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Approved Requests</h3>
                  </div>
                  <div className="space-y-3">
                    {approvedRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-[var(--color-success-bg)] rounded-xl">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{request.leaveTypeName}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)} ({request.totalDays} days)
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabPanel>
      </div>

      {/* Create Leave Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Submit Leave Request"
        size="md"
        footer={
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              icon={Plus}
              onClick={handleSubmitRequest}
              disabled={!isFormValid || createRequest.isPending}
              isLoading={createRequest.isPending}
            >
              Submit Request
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <div className="mb-4 p-3 bg-[var(--color-info-bg)] rounded-xl">
            <p className="text-sm text-[var(--color-info)]">
              Requesting as: <span className="font-medium">{user?.email || 'Logged In User'}</span>
            </p>
          </div>
          {/* Leave Type Select */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Leave Type <span className="text-[var(--color-danger)]">*</span>
            </label>
            <FilterSelect
              placeholder="Select leave type"
              value={selectedLeaveTypeId}
              onChange={setSelectedLeaveTypeId}
              options={leaveTypeOptions}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <DateRangePicker
            label="Leave Period *"
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          {/* Days Count Display */}
          {daysCount > 0 && (
            <div className="p-3 bg-[var(--color-info-bg)] rounded-xl">
              <p className="text-sm text-[var(--color-info)]">
                <span className="font-medium">{daysCount}</span> day{daysCount !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Reason (optional)
            </label>
            <textarea
              ref={reasonTextareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for leave request..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
            />
          </div>
        </div>
      </Modal>
    </EmployeePageWrapper>
  );
}
