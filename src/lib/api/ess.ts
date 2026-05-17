import { get, post, patch, put, uploadFile } from './http';
import type {
  StandardListResponse,
  StandardDetailResponse,
  MutationResponse,
  ListQueryParams,
} from '@/lib/types/api';

// ============================================================================
// Employee Self Service (ESS) API Wrapper
// Provides typed API methods for all ESS-related endpoints
// Pattern: Each domain has its own API object with getX, createX, etc.
// ============================================================================

// Helper to build query string from params (same pattern as master-data.ts)
function buildQueryString(params: ListQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function buildPaginationMeta(params: ListQueryParams, total: number) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function toDateTime(date: string, time?: string): string | undefined {
  if (!time) return undefined;
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

function normalizeAttendanceRecord(record: any): AttendanceRecord {
  const checkIn = record.checkIn ?? record.checkInAt;
  const checkOut = record.checkOut ?? record.checkOutAt;
  return {
    id: record.id,
    employeeId: record.employeeId,
    date: record.date ?? record.workDate,
    checkIn,
    checkOut,
    shiftName: record.shiftName ?? record.shift?.name ?? 'Assigned Shift',
    shiftStartTime: record.shiftStartTime ?? record.shift?.startTime ?? '--:--',
    shiftEndTime: record.shiftEndTime ?? record.shift?.endTime ?? '--:--',
    status: record.status,
    workDurationMinutes:
      record.workDurationMinutes ??
      (checkIn && checkOut
        ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000))
        : undefined),
    overtimeMinutes: record.overtimeMinutes,
    notes: record.notes,
  };
}

function normalizeAttendanceCorrection(correction: any): AttendanceCorrection {
  return {
    id: correction.id,
    attendanceId: correction.attendanceId ?? correction.attendanceRecordId ?? '',
    employeeId: correction.employeeId,
    date: correction.date ?? correction.correctionDate,
    originalCheckIn: correction.originalCheckIn ?? correction.attendanceRecord?.checkInAt,
    originalCheckOut: correction.originalCheckOut ?? correction.attendanceRecord?.checkOutAt,
    requestedCheckIn: correction.requestedCheckIn ?? correction.requestedCheckInAt,
    requestedCheckOut: correction.requestedCheckOut ?? correction.requestedCheckOutAt,
    reason: correction.reason,
    status: correction.status,
    approvedBy: correction.approvedBy,
    approvedAt: correction.approvedAt,
    createdAt: correction.createdAt,
  };
}

// ---------------------------------------------------------------------------
// ESS Types
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'SICK' | 'PERMISSION' | 'HOLIDAY' | 'WEEKEND';
  workDurationMinutes?: number;
  overtimeMinutes?: number;
  notes?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  employeeId: string;
  date: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'CANCELLED';
  currentApprover?: string;
  currentApproverName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalInboxItem {
  id: string;
  requestType: 'LEAVE_REQUEST' | 'ATTENDANCE_CORRECTION' | 'OVERTIME' | 'REIMBURSEMENT';
  requestId: string;
  requestDate: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  summary: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'NEEDS_REVISION';
}

export interface ApprovalHistoryItem extends ApprovalInboxItem {
  actionDate: string;
  actionBy?: string;
  actionByName?: string;
  actionNote?: string;
}

export interface ApprovalRequestDetailDto {
  id: string;
  entityType: 'LEAVE_REQUEST' | 'ATTENDANCE_CORRECTION';
  entityId: string;
  subject: string;
  description?: string;
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'CANCELLED';
  isUrgent: boolean;
  submittedAt: string;
  resolvedAt?: string;
  requesterEmployeeId: string;
  requesterEmployeeName: string;
  steps: Array<{
    id: string;
    stepOrder: number;
    approverEmployeeId: string;
    approverEmployeeName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'SKIPPED';
    actionDate?: string;
    remarks?: string;
  }>;
  actions: Array<{
    id: string;
    stepId: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    actorEmployeeId: string;
    actorEmployeeName: string;
    actionDate: string;
    remarks?: string;
  }>;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentCategoryId: string;
  documentCategoryName: string;
  documentCategoryCode: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  uploadedAt?: string;
}

export interface EmployeeProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodType?: string | null;
  religion?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  photoUrl?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  divisionId?: string | null;
  divisionName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  positionId?: string | null;
  positionName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  joinDate?: string | null;
  confirmationDate?: string | null;
  endDate?: string | null;
  employmentStatus: string;
  employmentType: string;
  isActive: boolean;
  profileCompleteness?: number;
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    address?: string;
    isPrimary: boolean;
  }>;
}

export interface Notification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  referenceType?: 'leave_request' | 'attendance_correction' | 'approval' | 'document' | 'announcement';
  referenceId?: string;
  createdAt: string;
}

export interface ESSHomeData {
  profile: {
    employeeId: string;
    fullName: string;
    preferredName: string | null;
    branch: string | null;
    department: string | null;
    position: string | null;
  } | null;
  attendanceToday: {
    checkedIn: boolean;
    checkedOut: boolean;
    status: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
  };
  leaveBalance: {
    leaveType: string;
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  } | null;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
  expiringDocuments: Array<{
    documentId: string;
    documentName: string;
    category: string | null;
    expiryDate: string | null;
    status: string;
  }>;
}

type ESSHomeApiResponse = StandardDetailResponse<ESSHomeData> | ESSHomeData;

export interface MyRequestItem {
  id: string;
  requestType: 'leave' | 'attendance_correction' | 'overtime' | 'reimbursement';
  requestDate: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentApprover?: string;
  currentApproverName?: string;
  actionDate?: string;
}

export interface UnifiedRequestItem {
  requestType: 'LEAVE' | 'ATTENDANCE_CORRECTION';
  requestId: string;
  entityId: string;
  submittedAt: string;
  status: string;
  currentApprover: string | null;
  lastAction: string;
  details: {
    leaveType?: string | null;
    startDate?: string;
    endDate?: string;
    daysCount?: string;
    reason?: string | null;
    correctionDate?: string;
    requestedCheckInAt?: string | null;
    requestedCheckOutAt?: string | null;
  };
}

export interface MyRequestsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MyRequestsResponse {
  data: UnifiedRequestItem[];
  meta: MyRequestsMeta;
}

export interface MyDocumentsItem {
  id: string;
  documentCategoryId: string;
  documentCategoryName: string;
  documentCategoryCode: string;
  fileUrl?: string;
  status: string;
  expiryDate?: string;
  uploadedAt?: string;
  fileName?: string;
}

export interface MyDocumentsSummary {
  valid: number;
  nearExpiry: number;
  expired: number;
  missing: number;
}

export interface MyDocumentsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MyDocumentsResponse {
  data: MyDocumentsItem[];
  meta: MyDocumentsMeta;
  summary: MyDocumentsSummary;
}

// ---------------------------------------------------------------------------
// Attendance API
// ---------------------------------------------------------------------------

export const attendanceApi = {
  getToday: async () => {
    const response = await get<StandardDetailResponse<any | null>>('/attendance/me/today');
    return {
      ...response,
      data: response.data ? normalizeAttendanceRecord(response.data) : null,
    } as StandardDetailResponse<AttendanceRecord | null>;
  },

  getHistory: async (params: ListQueryParams = {}) => {
    const response = await get<(StandardListResponse<any> & { total?: number })>(`/attendance/me${buildQueryString(params)}`);
    return {
      data: (response.data || []).map(normalizeAttendanceRecord),
      meta: response.meta ?? buildPaginationMeta(params, response.total ?? response.data?.length ?? 0),
    };
  },

  getCorrections: async (params: ListQueryParams = {}) => {
    const response = await get<(StandardListResponse<any> & { total?: number })>(`/attendance/corrections/me${buildQueryString(params)}`);
    return {
      data: (response.data || []).map(normalizeAttendanceCorrection),
      meta: response.meta ?? buildPaginationMeta(params, response.total ?? response.data?.length ?? 0),
    };
  },

  checkIn: async () => {
    const response = await post<Record<string, never>, MutationResponse<any>>('/attendance/check-in', {});
    return {
      ...response,
      data: response.data ? normalizeAttendanceRecord(response.data) : undefined,
    } as MutationResponse<AttendanceRecord>;
  },

  checkOut: async () => {
    const response = await post<Record<string, never>, MutationResponse<any>>('/attendance/check-out', {});
    return {
      ...response,
      data: response.data ? normalizeAttendanceRecord(response.data) : undefined,
    } as MutationResponse<AttendanceRecord>;
  },

  requestCorrection: async (payload: {
    attendanceId: string;
    date: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }) => {
    const backendPayload = {
      attendanceRecordId: payload.attendanceId || undefined,
      correctionDate: payload.date,
      requestedCheckInAt: toDateTime(payload.date, payload.requestedCheckIn),
      requestedCheckOutAt: toDateTime(payload.date, payload.requestedCheckOut),
      reason: payload.reason,
    };
    const response = await post<typeof backendPayload, MutationResponse<any>>('/attendance/corrections', backendPayload);
    return {
      ...response,
      data: response.data ? normalizeAttendanceCorrection(response.data) : undefined,
    } as MutationResponse<AttendanceCorrection>;
  },
};

// ---------------------------------------------------------------------------
// Leave API
// ---------------------------------------------------------------------------

export const leaveApi = {
  getTypes: () =>
    get<StandardListResponse<{ id: string; name: string; code: string; deductBalance: boolean; requiresAttachment: boolean; maxDaysPerRequest?: number | null; status: string }>>('/leave/types'),

  getBalances: () =>
    get<StandardListResponse<LeaveBalance>>('/leave/balances/me'),

  getRequests: (params: ListQueryParams = {}) =>
    get<StandardListResponse<LeaveRequest>>(`/leave/requests/me${buildQueryString(params)}`),

  createRequest: (payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) =>
    post<typeof payload, MutationResponse<LeaveRequest>>('/leave/requests', payload),

  cancelRequest: (id: string) =>
    put<Record<string, never>, MutationResponse<LeaveRequest>>(`/leave/requests/${id}/cancel`, {}),
};

// ---------------------------------------------------------------------------
// Approvals API
// ---------------------------------------------------------------------------

export const approvalsApi = {
  getInbox: (params: ListQueryParams = {}) =>
    get<StandardListResponse<ApprovalInboxItem>>(`/approvals/inbox${buildQueryString(params)}`),

  getHistory: (params: ListQueryParams = {}) =>
    get<StandardListResponse<ApprovalHistoryItem>>(`/approvals/history${buildQueryString(params)}`),

  getDetail: (id: string) =>
    get<StandardDetailResponse<ApprovalRequestDetailDto>>(`/approvals/${id}`),

  approve: (id: string, payload?: { note?: string }) =>
    post<typeof payload, MutationResponse>(`/approvals/${id}/approve`, payload || {}),

  reject: (id: string, payload: { reason: string }) =>
    post<typeof payload, MutationResponse>(`/approvals/${id}/reject`, payload),

  requestRevision: (id: string, payload: { remarks?: string }) =>
    post<typeof payload, MutationResponse>(`/approvals/${id}/request-revision`, payload),
};

// ---------------------------------------------------------------------------
// Notifications API
// ---------------------------------------------------------------------------

export const notificationsApi = {
  getUnreadCount: () =>
    get<StandardDetailResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: string) =>
    post<Record<string, never>, MutationResponse>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    post<Record<string, never>, MutationResponse>('/notifications/read-all', {}),
};

// ---------------------------------------------------------------------------
// Documents API
// ---------------------------------------------------------------------------

export const documentsApi = {
  getMyDocuments: (params: ListQueryParams = {}) =>
    get<StandardListResponse<EmployeeDocument>>(`/documents/me${buildQueryString(params)}`),

  getMyMissing: (params: ListQueryParams = {}) =>
    get<StandardListResponse<EmployeeDocument>>(`/documents/me/missing${buildQueryString(params)}`),

  getMyExpiring: (params: ListQueryParams = {}) =>
    get<StandardListResponse<EmployeeDocument>>(`/documents/me/expiring${buildQueryString(params)}`),

  getCategories: () =>
    get<StandardListResponse<{ id: string; code: string; name: string; requiresExpiry: boolean; isMandatory: boolean; status: string }>>('/documents/categories'),

  uploadMyDocument: (data: { file: File; documentCategoryId: string; issuedAt?: string; expiryDate?: string }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('documentCategoryId', data.documentCategoryId);
    if (data.issuedAt) formData.append('issuedAt', data.issuedAt);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    return uploadFile<MutationResponse<{ id: string; publicId: string; fileKey: string; fileName: string; status: string }>>('/documents/me/upload', formData);
  },

  getDownloadUrl: (documentId: string) =>
    `/api/v1/documents/${documentId}/download`,
};

// ---------------------------------------------------------------------------
// Profile API
// ---------------------------------------------------------------------------

export const profileApi = {
  getMe: () =>
    get<StandardDetailResponse<EmployeeProfile>>('/employees/me'),

  updateMe: (payload: Partial<EmployeeProfile>) =>
    patch<typeof payload, MutationResponse<EmployeeProfile>>('/employees/me', payload),
};

// ---------------------------------------------------------------------------
// ESS Home API
// ---------------------------------------------------------------------------

export const essApi = {
  getHome: async (): Promise<StandardDetailResponse<ESSHomeData>> => {
    const response = await get<ESSHomeApiResponse>('/employee-self-service/home');
    if (response && typeof response === 'object' && 'data' in response) {
      return response as StandardDetailResponse<ESSHomeData>;
    }

    return { data: response as ESSHomeData };
  },

  getMyRequests: (params: ListQueryParams = {}) =>
    get<MyRequestsResponse>(`/employee-self-service/my-requests${buildQueryString(params)}`),

  getMyDocuments: (params: ListQueryParams = {}) =>
    get<MyDocumentsResponse>(`/employee-self-service/my-documents${buildQueryString(params)}`),
};

// Export all APIs as a single object
export const ess = {
  attendance: attendanceApi,
  leave: leaveApi,
  approvals: approvalsApi,
  notifications: notificationsApi,
  documents: documentsApi,
  profile: profileApi,
  home: essApi,
} as const;
