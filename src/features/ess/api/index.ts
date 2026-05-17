// Re-export all ESS API functions
export * from '@/lib/api/ess';

// Re-export all ESS hooks
export { useHomeData } from '@/features/ess/hooks/useHomeData';
export { useMyAttendanceToday, useMyAttendanceHistory, useMyAttendanceCorrections, useCheckIn, useCheckOut, useRequestAttendanceCorrection } from '@/features/ess/hooks/useMyAttendance';
export { useMyLeaveTypes, useMyLeaveBalances, useMyLeaveRequests, useCreateLeaveRequest, useCancelLeaveRequest } from '@/features/ess/hooks/useMyLeave';
export { useMyRequests } from '@/features/ess/hooks/useMyRequests';
export { useMyProfile, useUpdateMyProfile } from '@/features/ess/hooks/useMyProfile';
export { useMyDocuments, useMyMissingDocuments, useMyExpiringDocuments } from '@/features/ess/hooks/useMyDocuments';
export { useApprovalInbox, useApprovalHistory, useApprovalDetail, useApproveRequest, useRejectRequest, useRequestRevision } from '@/features/ess/hooks/useMyApprovals';
export { useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/features/ess/hooks/useMyNotifications';