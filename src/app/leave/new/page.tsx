'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Paperclip, AlertCircle } from 'lucide-react';
import { useMyLeaveTypes, useCreateLeaveRequest } from '@/features/ess/hooks/useMyLeave';
import { useRouter } from 'next/navigation';

export default function NewLeavePage() {
  const router = useRouter();
  const { data: leaveTypesData } = useMyLeaveTypes();
  const createLeaveRequest = useCreateLeaveRequest();
  const leaveTypesList = leaveTypesData?.data ?? [];

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysCount = calculateDays();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!leaveTypeId) newErrors.leaveTypeId = 'Leave type is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!reason.trim()) newErrors.reason = 'Reason is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createLeaveRequest.mutateAsync({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      router.push('/leave');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="Submit Leave Request"
      subtitle="Request time off from work"
    >
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/leave')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leave Management
      </button>

      <div className="max-w-2xl">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Leave Request Details</h3>

          <div className="space-y-5">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Leave Type <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                  errors.leaveTypeId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                }`}
              >
                <option value="">Select leave type</option>
                {leaveTypesList.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {errors.leaveTypeId && (
                <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.leaveTypeId}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Start Date <span className="text-[var(--color-danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full h-10 px-3 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.startDate ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  End Date <span className="text-[var(--color-danger)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className={`w-full h-10 px-3 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.endDate ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                </div>
                {errors.endDate && (
                  <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {startDate && endDate && daysCount > 0 && (
              <div className="p-4 bg-[var(--color-info-bg)] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--color-info)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--color-info)]">{daysCount}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">day{daysCount > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Reason <span className="text-[var(--color-danger)]">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the reason for your leave request..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 resize-none ${
                  errors.reason ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                }`}
              />
              {errors.reason && (
                <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reason}
                </p>
              )}
            </div>

            {/* Attachment (optional) */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Attachment
                <span className="text-[var(--color-text-muted)] font-normal ml-1">(optional, for sick leave)</span>
              </label>
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg)] hover:border-[var(--color-accent)] transition-colors cursor-pointer">
                <input type="file" className="hidden" id="attachment-upload" />
                <label htmlFor="attachment-upload" className="flex flex-col items-center cursor-pointer">
                  <Paperclip className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Click to upload or drag and drop</span>
                  <span className="text-xs text-[var(--color-text-muted)] mt-1">PDF, JPG, or PNG (max 5MB)</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-4 mt-6 rounded-xl shadow-lg flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.push('/leave')}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            icon={Calendar}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
