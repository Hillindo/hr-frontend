'use client';

import { cn } from '@/lib/utils';
import { RequestStatus, DocumentStatus, AttendanceStatus } from '@/lib/types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
}

export function getStatusBadge(status: RequestStatus | DocumentStatus | AttendanceStatus | string): { variant: BadgeVariant; label: string } {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    // Request Status
    DRAFT: { variant: 'neutral', label: 'Draft' },
    SUBMITTED: { variant: 'info', label: 'Submitted' },
    PENDING: { variant: 'warning', label: 'Pending' },
    APPROVED: { variant: 'success', label: 'Approved' },
    REJECTED: { variant: 'danger', label: 'Rejected' },
    NEEDS_REVISION: { variant: 'warning', label: 'Needs Revision' },
    CANCELLED: { variant: 'neutral', label: 'Cancelled' },
    // Document Status
    VALID: { variant: 'success', label: 'Valid' },
    NEAR_EXPIRY: { variant: 'warning', label: 'Near Expiry' },
    EXPIRED: { variant: 'danger', label: 'Expired' },
    MISSING: { variant: 'danger', label: 'Missing' },
    // Attendance Status
    PRESENT: { variant: 'success', label: 'Present' },
    LATE: { variant: 'warning', label: 'Late' },
    ABSENT: { variant: 'danger', label: 'Absent' },
    ON_LEAVE: { variant: 'info', label: 'On Leave' },
    SICK: { variant: 'warning', label: 'Sick' },
    PERMISSION: { variant: 'info', label: 'Permission' },
    HOLIDAY: { variant: 'neutral', label: 'Holiday' },
    WEEKEND: { variant: 'neutral', label: 'Weekend' },
    // Payroll Status
    DRAFT_PAYROLL: { variant: 'warning', label: 'Draft' },
    UNDER_REVIEW: { variant: 'info', label: 'Under Review' },
    READY_FOR_PAYMENT: { variant: 'success', label: 'Ready for Payment' },
    PAID: { variant: 'neutral', label: 'Paid' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    CANCELLED_PAYROLL: { variant: 'danger', label: 'Cancelled' },
  };

  return statusMap[status] || { variant: 'neutral', label: status };
}

export function StatusBadge({ status }: { status: RequestStatus | DocumentStatus | AttendanceStatus | string }) {
  const { variant, label } = getStatusBadge(status);
  return <Badge variant={variant}>{label}</Badge>;
}
