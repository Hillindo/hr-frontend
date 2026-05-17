/**
 * Normalizes status values between frontend and backend.
 * Backend returns uppercase ('PENDING', 'APPROVED'), frontend uses lowercase.
 */

// Status value mappings
const STATUS_MAP = {
  // Backend to frontend
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  NEEDS_REVISION: 'needs_revision',
  SUBMITTED: 'submitted',
  // Frontend to backend (for API requests)
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
  needs_revision: 'NEEDS_REVISION',
  submitted: 'SUBMITTED',
} as const;

/**
 * Convert backend status (uppercase) to frontend display status (lowercase)
 */
export function toFrontendStatus(status: string): string {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] ?? status.toLowerCase();
}

/**
 * Convert frontend status (lowercase) to backend API status (uppercase)
 */
export function toBackendStatus(status: string): string {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] ?? status.toUpperCase();
}

/**
 * Check if a status is considered "active" (not terminal)
 */
export function isActiveStatus(status: string): boolean {
  const activeStatuses = ['PENDING', 'SUBMITTED', 'NEEDS_REVISION', 'pending', 'submitted', 'needs_revision'];
  return activeStatuses.includes(status);
}

/**
 * Check if a status is considered "terminal" (completed state)
 */
export function isTerminalStatus(status: string): boolean {
  const terminalStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'approved', 'rejected', 'cancelled'];
  return terminalStatuses.includes(status);
}

/**
 * Get display label for a status value
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    NEEDS_REVISION: 'Needs Revision',
    SUBMITTED: 'Submitted',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    needs_revision: 'Needs Revision',
    submitted: 'Submitted',
  };
  return labels[status] ?? status;
}
