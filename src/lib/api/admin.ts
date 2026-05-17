import { del, get, patch, post, put, uploadFile } from './http';
import type {
  StandardListResponse,
  StandardDetailResponse,
  MutationResponse,
  ListQueryParams,
} from '@/lib/types/api';

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

export interface HrDashboardData {
  pendingApprovals: number;
  pendingApprovalsUrgent: number;
  attendanceIssuesToday: number;
  employeesOnLeaveToday: number;
  documentsNearExpiry: number;
  incompleteProfiles: number;
  contractsNearEnd: number;
  recentApprovals: Array<{
    id: string;
    requestType: string;
    requesterName: string;
    requesterDepartment: string;
    summary: string;
    submittedAt: string;
    status: string;
  }>;
  recentAttendanceIssues: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    date: string;
    status: string;
  }>;
  recentExpiringDocuments: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    documentCategoryName: string;
    expiryDate: string | null;
    status: string;
  }>;
}

export interface ManagerDashboardData {
  pendingApprovals: number;
  pendingApprovalsUrgent: number;
  teamOnLeaveToday: number;
  teamAttendanceIssues: number;
  teamHeadcount: number;
  presentToday: number;
  recentApprovals: Array<{
    id: string;
    requestType: string;
    requesterName: string;
    requesterDepartment: string;
    summary: string;
    submittedAt: string;
    status: string;
  }>;
  teamAlerts: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    issueType: string;
    quickAction: string;
  }>;
}

export const dashboardApi = {
  getHr: (params?: ListQueryParams) =>
    get<StandardDetailResponse<HrDashboardData>>(`/dashboard/hr${buildQueryString(params as Record<string, unknown> || {})}`),

  getManager: (params?: ListQueryParams) =>
    get<StandardDetailResponse<ManagerDashboardData>>(`/dashboard/manager${buildQueryString(params as Record<string, unknown> || {})}`),
};

// ---------------------------------------------------------------------------
// Attendance Admin API — cursor-paginated list endpoints
// ---------------------------------------------------------------------------

export interface AttendanceAdminRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  workDate: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status: string;
  lateMinutes: number;
  source: string;
  notes?: string | null;
}

export interface AttendanceSummary {
  date: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  sick: number;
  permission: number;
  missingCheckout: number;
  complianceRate: number;
}

export interface AttendanceCorrectionAdmin {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  workDate: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: string;
  createdAt: string;
}

// Cursor-paginated params for attendance list endpoints
// Matches backend AttendanceCursorQueryDto fields
interface AttendanceCursorParams {
  limit?: number;
  cursor?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  source?: string;
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
  sortBy?: string;
}

interface AttendanceSummaryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  branchId?: string;
  employeeId?: string;
}

interface AssistedAttendancePayload {
  employeeId: string;
  workDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: string;
  notes?: string;
}

export const attendanceAdminApi = {
  getList: (params: AttendanceCursorParams = {}) =>
    get<CursorPaginatedResponse<AttendanceAdminRecord>>(`/attendance${buildQueryString(params as Record<string, unknown>)}`),

  getTeam: (params: AttendanceCursorParams = {}) =>
    get<CursorPaginatedResponse<AttendanceAdminRecord>>(`/attendance/team${buildQueryString(params as Record<string, unknown>)}`),

  getSummary: (params: AttendanceSummaryParams = {}) =>
    get<StandardDetailResponse<AttendanceSummary>>(`/attendance/summary${buildQueryString(params as Record<string, unknown>)}`),

  getTeamSummary: (params: AttendanceSummaryParams = {}) =>
    get<StandardDetailResponse<AttendanceSummary>>(`/attendance/team/summary${buildQueryString(params as Record<string, unknown>)}`),

  getCorrections: (params: AttendanceCursorParams = {}) =>
    get<CursorPaginatedResponse<AttendanceCorrectionAdmin>>(`/attendance/corrections${buildQueryString(params as Record<string, unknown>)}`),

  createAssisted: (payload: AssistedAttendancePayload) =>
    post<AssistedAttendancePayload, MutationResponse<AttendanceAdminRecord>>('/attendance/assisted', payload),
};

// ---------------------------------------------------------------------------
// Documents Admin API
// ---------------------------------------------------------------------------

export interface DocumentAdminRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  documentCategoryId: string;
  documentCategoryName: string;
  fileName: string;
  fileUrl?: string;
  uploadedAt: string;
  expiryDate?: string;
  status: string;
  uploadedByName: string;
}

export interface ExpiringDocumentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  documentCategoryName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
}

export interface MissingDocumentRecord {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  missingCategoryId: string;
  missingCategoryName: string;
  missingCategoryCode: string;
  isMandatory: boolean;
}

interface DocumentAdminParams extends ListQueryParams {
  status?: string;
  documentCategoryId?: string;
  employeeId?: string;
}

interface ExpiringDocumentParams {
  days?: number;
  limit?: number;
  cursor?: string;
}

export const documentsAdminApi = {
  getList: (params: DocumentAdminParams = {}) =>
    get<StandardListResponse<DocumentAdminRecord>>(`/documents${buildQueryString(params as Record<string, unknown>)}`),

  getExpiring: (params: ExpiringDocumentParams = {}) =>
    get<StandardListResponse<ExpiringDocumentRecord>>(`/documents/expiring${buildQueryString(params as Record<string, unknown>)}`),

  getMissing: (params: ListQueryParams = {}) =>
    get<StandardListResponse<MissingDocumentRecord>>(`/documents/missing${buildQueryString(params as Record<string, unknown>)}`),

  getCategories: () =>
    get<StandardListResponse<{ id: string; code: string; name: string; description?: string; requiresExpiry: boolean; isMandatory: boolean; isActive: boolean }>>('/documents/categories'),
};

// ---------------------------------------------------------------------------
// Leave Admin API
// ---------------------------------------------------------------------------

export interface LeaveTeamRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: string;
  currentApproverName?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface LeaveTenantBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

interface LeaveTeamParams extends ListQueryParams {
  status?: string;
  employeeId?: string;
}

interface LeaveTenantParams extends ListQueryParams {
  status?: string;
  typeCode?: string;
  employeeId?: string;
}

interface LeaveTenantBalanceParams {
  year?: number;
  page?: number;
  pageSize?: number;
  employeeId?: string;
}

export const leaveAdminApi = {
  getTeamRequests: (params: LeaveTeamParams = {}) =>
    get<StandardListResponse<LeaveTeamRequest>>(`/leave/team${buildQueryString(params as Record<string, unknown>)}`),

  getTenantRequests: (params: LeaveTenantParams = {}) =>
    get<StandardListResponse<LeaveTeamRequest>>(`/leave/tenant${buildQueryString(params as Record<string, unknown>)}`),

  getTenantBalances: (params: LeaveTenantBalanceParams = {}) =>
    get<StandardListResponse<LeaveTenantBalance>>(`/leave/balances/tenant${buildQueryString(params as Record<string, unknown>)}`),

  getTypes: () =>
    get<StandardListResponse<{ id: string; name: string; code: string; deductBalance: boolean; requiresAttachment: boolean; maxDaysPerRequest?: number | null; status: string }>>('/leave/types'),

  approveRequest: (id: string) =>
    put<Record<string, never>, MutationResponse>(`/leave/requests/${id}/approve`, {}),

  rejectRequest: (id: string, payload: { reason: string }) =>
    put<typeof payload, MutationResponse>(`/leave/requests/${id}/reject`, payload),
};

// ---------------------------------------------------------------------------
// Employees Admin API
// ---------------------------------------------------------------------------

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
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
  employmentStatus: string;
  employmentType: string;
  joinDate?: string | null;
  profileCompleteness: number;
  isActive: boolean;
}

export interface EmergencyContactItem {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  address?: string;
  isPrimary: boolean;
}

export interface EmployeeDetail extends EmployeeListItem {
  birthDate?: string;
  gender?: string;
  nik?: string;
  npwp?: string;
  maritalStatus?: string;
  bloodType?: string;
  religion?: string;
  nationality?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  photoUrl?: string;
  confirmationDate?: string;
  endDate?: string;
  dependentsCount?: number;
  companyName?: string;
  emergencyContacts?: EmergencyContactItem[];
  missingFields?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  bpjsKesehatanNumber?: string;
  bpjsKetenagakerjaanNumber?: string;
  salaryGroup?: string;
}

export interface DirectReport {
  id: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string;
  positionName: string;
  departmentName: string;
  employmentStatus: string;
  isActive: boolean;
}

interface EmployeeListParams extends ListQueryParams {
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  positionId?: string;
  employmentStatus?: string;
  employmentType?: string;
  isActive?: string;
}

export interface CreateEmployeePayload {
  fullName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  branchId: string;
  divisionId: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  employmentType: string;
  employmentStatus?: string;
  joinDate: string;
  gender?: string;
  birthDate?: string;
  nik?: string;
  npwp?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  nik?: string;
  npwp?: string;
  maritalStatus?: string;
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  employmentType?: string;
  employmentStatus?: string;
  joinDate?: string;
  endDate?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  bpjsKesehatanNumber?: string;
  bpjsKetenagakerjaanNumber?: string;
  salaryGroupId?: string;
}

export const employeesApi = {
  getList: (params: EmployeeListParams = {}) =>
    get<StandardListResponse<EmployeeListItem>>(`/employees${buildQueryString(params as Record<string, unknown>)}`),

  getDetail: (id: string) =>
    get<StandardDetailResponse<EmployeeDetail>>(`/employees/${id}`),

  create: (payload: CreateEmployeePayload) =>
    post<CreateEmployeePayload, MutationResponse<EmployeeDetail>>('/employees', payload),

  update: (id: string, payload: UpdateEmployeePayload) =>
    patch<UpdateEmployeePayload, MutationResponse<EmployeeDetail>>(`/employees/${id}`, payload),

  getDirectReports: () =>
    get<StandardListResponse<DirectReport>>('/employees/me/direct-reports'),
};

// ---------------------------------------------------------------------------
// Schedules API
// ---------------------------------------------------------------------------

export interface ScheduleItem {
  id: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  shiftId: string;
  shiftCode?: string | null;
  shiftName?: string | null;
  date: string;
  status: string;
  source?: string;
  note?: string | null;
  employee?: {
    employeeCode?: string | null;
    fullName?: string | null;
  };
  shift?: {
    code?: string | null;
    name?: string | null;
  };
}

export interface ScheduleSelfItem {
  id: string;
  shiftId: string;
  shiftCode?: string | null;
  shiftName?: string | null;
  date: string;
  status: string;
  source?: string;
  note?: string | null;
  shift?: {
    code?: string | null;
    name?: string | null;
  };
}

interface ScheduleParams extends ListQueryParams {
  employeeId?: string;
  shiftId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface ScheduleSelfParams {
  startDate?: string;
  endDate?: string;
}

interface AssignSchedulePayload {
  employeeId: string;
  shiftId: string;
  date: string;
  note?: string;
}

interface BulkAssignSchedulePayload {
  employeeIds: string[];
  shiftId: string;
  startDate: string;
  endDate: string;
  applyOnlyWorkdays?: boolean;
  note?: string;
}

interface PublishSchedulePayload {
  employeeIds?: string[];
  startDate: string;
  endDate: string;
}

export const schedulesApi = {
  getList: (params: ScheduleParams = {}) =>
    get<{ data: ScheduleItem[]; total: number }>(`/schedules${buildQueryString(params as Record<string, unknown>)}`),

  getSelf: (params: ScheduleSelfParams = {}) =>
    get<{ data: ScheduleSelfItem[]; total: number }>(`/schedules/me${buildQueryString(params as Record<string, unknown>)}`),

  assign: (payload: AssignSchedulePayload) =>
    post<AssignSchedulePayload, MutationResponse<ScheduleItem>>('/schedules/assign', payload),

  bulkAssign: (payload: BulkAssignSchedulePayload) =>
    post<BulkAssignSchedulePayload, MutationResponse>('/schedules/bulk-assign', payload),

  publish: (payload: PublishSchedulePayload) =>
    post<PublishSchedulePayload, MutationResponse>('/schedules/publish', payload),
};

// ---------------------------------------------------------------------------
// Notifications API (list) — cursor-paginated
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasNext: boolean;
  };
}

interface NotificationListParams {
  limit?: number;
  cursor?: string;
  search?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  read?: string;
  startDate?: string;
  endDate?: string;
}

export const notificationsListApi = {
  getList: (params: NotificationListParams = {}) =>
    get<CursorPaginatedResponse<NotificationItem>>(`/notifications${buildQueryString(params as Record<string, unknown>)}`),
};

// ---------------------------------------------------------------------------
// Payroll Support API
// ---------------------------------------------------------------------------

export interface PayrollPreviewRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  branchName?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
  salaryGroupName?: string | null;
  baseSalary: number;
  allowanceTotal: number;
  grossSalary: number;
  attendanceDeduction: number;
  leaveDeduction: number;
  otherDeduction: number;
  totalDeduction: number;
  netSalary: number;
  attendanceSummary: {
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    unpaidLeaveDays: number;
  };
  flags: Array<{
    type: string;
    label: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
}

export interface PayrollPreviewResponse {
  summary: {
    totalEmployeesIncluded: number;
    totalGrossSalary: number;
    totalDeduction: number;
    totalNetSalary: number;
    criticalAnomalies: number;
    warningAnomalies: number;
    pendingApprovals: number;
  };
  period: {
    start: string;
    end: string;
  };
  items: PayrollPreviewRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayrollRunItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName?: string | null;
  salaryGroup?: string | null;
  baseSalary: number;
  dailyRate: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  sickDays: number;
  permissionDays: number;
  missingCheckoutDays: number;
  lateMinutes: number;
  paidDays: number;
  grossEarnings: number;
  manualEarning: number;
  manualDeduction: number;
  absenceDeduction: number;
  lateDeduction: number;
  totalDeduction: number;
  netPay: number;
  isManuallyEdited: boolean;
  adjustmentReason?: string | null;
  notes?: string | null;
  deductionBreakdown: Array<{ code: string; name: string; calculationType: string; value: number; amount: number }>;
}

export type PayrollRunStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'READY_FOR_PAYMENT'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  currency: string;
  workingDays: number;
  itemCount: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
  generatedByUserId: string;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  paymentReadyByUserId?: string | null;
  paymentReadyAt?: string | null;
  cancelledByUserId?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  lastStatusChangeReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PayrollRunItem[];
}

export interface PayrollAnomaly {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: PayrollAnomalyType;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  branchName?: string | null;
  departmentName?: string | null;
  message: string;
  payrollImpact: string;
  actionLabel: string;
  actionHref: string;
  metadata?: Record<string, unknown>;
}

export type PayrollAnomalyType =
  | 'missing_salary_group'
  | 'missing_bank_account'
  | 'missing_tax_number'
  | 'missing_bpjs'
  | 'missing_schedule'
  | 'incomplete_attendance'
  | 'pending_attendance_correction'
  | 'pending_leave_request'
  | 'unpaid_leave'
  | 'resigned_employee_included'
  | 'joined_mid_period'
  | 'incomplete_deduction_data';

export interface PayrollAnomaliesResponse {
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  period: {
    start: string;
    end: string;
  };
  items: PayrollAnomaly[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PayrollPreviewParams {
  periodStart?: string;
  periodEnd?: string;
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  hasAnomalies?: boolean;
  profileComplete?: boolean;
}

interface PayrollAnomaliesParams {
  periodStart?: string;
  periodEnd?: string;
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  severity?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface PayrollRunParams extends ListQueryParams {
  periodStart?: string;
  periodEnd?: string;
  status?: string;
}

export interface CreatePayrollRunPayload {
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

export interface UpdatePayrollRunItemPayload {
  baseSalary?: number;
  manualEarning?: number;
  manualDeduction?: number;
  notes?: string;
  reason?: string;
}

export interface UpdatePayrollRunStatusPayload {
  status: PayrollRunStatus;
  reason?: string;
}

export const payrollSupportApi = {
  getRuns: (params: PayrollRunParams = {}) =>
    get<StandardListResponse<PayrollRun>>(`/payroll-support/runs${buildQueryString(params as Record<string, unknown>)}`),

  createRun: (payload: CreatePayrollRunPayload) =>
    post<CreatePayrollRunPayload, MutationResponse<PayrollRun>>('/payroll-support/runs', payload),

  getRun: (id: string) =>
    get<StandardDetailResponse<PayrollRun>>(`/payroll-support/runs/${id}`),

  updateRunItem: (runId: string, itemId: string, payload: UpdatePayrollRunItemPayload) =>
    patch<UpdatePayrollRunItemPayload, MutationResponse<PayrollRun>>(`/payroll-support/runs/${runId}/items/${itemId}`, payload),

  updateRunStatus: (id: string, payload: UpdatePayrollRunStatusPayload) =>
    patch<UpdatePayrollRunStatusPayload, MutationResponse<PayrollRun>>(`/payroll-support/runs/${id}/status`, payload),

  markReadyForPayment: (id: string, payload: { notes?: string; reason?: string } = {}) =>
    post<typeof payload, MutationResponse<PayrollRun>>(`/payroll-support/runs/${id}/ready-for-payment`, payload),

  getPreview: (params: PayrollPreviewParams = {}) =>
    get<PayrollPreviewResponse>(`/payroll-support/preview${buildQueryString(params as Record<string, unknown>)}`),

  getAnomalies: (params: PayrollAnomaliesParams = {}) =>
    get<PayrollAnomaliesResponse>(`/payroll-support/anomalies${buildQueryString(params as Record<string, unknown>)}`),
};

// ---------------------------------------------------------------------------
// Payroll Config API (Salary Groups & Deduction Types)
// ---------------------------------------------------------------------------

export interface SalaryGroup {
  id: string;
  code: string;
  name: string;
  baseSalary: number;
  dailyRate: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollDeductionType {
  id: string;
  code: string;
  name: string;
  calculationType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER';
  value: number;
  appliesToAll: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryGroupPayload {
  code: string;
  name: string;
  baseSalary: number;
  dailyRate?: number;
  hourlyRate?: number;
  isActive?: boolean;
}

export interface UpdateSalaryGroupPayload {
  name?: string;
  baseSalary?: number;
  dailyRate?: number;
  hourlyRate?: number;
  isActive?: boolean;
}

export interface CreateDeductionTypePayload {
  code: string;
  name: string;
  calculationType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER';
  value: number;
  appliesToAll?: boolean;
  isActive?: boolean;
}

export interface UpdateDeductionTypePayload {
  name?: string;
  calculationType?: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'DAILY_RATE_MULTIPLIER';
  value?: number;
  appliesToAll?: boolean;
  isActive?: boolean;
}

interface SalaryGroupParams extends ListQueryParams {
  isActive?: string;
}

interface DeductionTypeParams extends ListQueryParams {
  isActive?: string;
  calculationType?: string;
}

export const salaryGroupsApi = {
  getList: (params: SalaryGroupParams = {}) =>
    get<StandardListResponse<SalaryGroup>>(`/payroll-config/salary-groups${buildQueryString(params as Record<string, unknown>)}`),

  getDetail: (id: string) =>
    get<StandardDetailResponse<SalaryGroup>>(`/payroll-config/salary-groups/${id}`),

  create: (payload: CreateSalaryGroupPayload) =>
    post<CreateSalaryGroupPayload, MutationResponse<SalaryGroup>>('/payroll-config/salary-groups', payload),

  update: (id: string, payload: UpdateSalaryGroupPayload) =>
    patch<UpdateSalaryGroupPayload, MutationResponse<SalaryGroup>>(`/payroll-config/salary-groups/${id}`, payload),

  delete: (id: string) =>
    del<{ message: string }>(`/payroll-config/salary-groups/${id}`),
};

export const deductionTypesApi = {
  getList: (params: DeductionTypeParams = {}) =>
    get<StandardListResponse<PayrollDeductionType>>(`/payroll-config/deduction-types${buildQueryString(params as Record<string, unknown>)}`),

  getDetail: (id: string) =>
    get<StandardDetailResponse<PayrollDeductionType>>(`/payroll-config/deduction-types/${id}`),

  create: (payload: CreateDeductionTypePayload) =>
    post<CreateDeductionTypePayload, MutationResponse<PayrollDeductionType>>('/payroll-config/deduction-types', payload),

  update: (id: string, payload: UpdateDeductionTypePayload) =>
    patch<UpdateDeductionTypePayload, MutationResponse<PayrollDeductionType>>(`/payroll-config/deduction-types/${id}`, payload),

  delete: (id: string) =>
    del<{ message: string }>(`/payroll-config/deduction-types/${id}`),
};

// ---------------------------------------------------------------------------
// Audit Logs API
// ---------------------------------------------------------------------------

export interface AuditLogItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  createdAt: string;
  ipAddress?: string | null;
  summary?: string | null;
}

interface AuditLogParams {
  limit?: number;
  cursor?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  actorUserId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'asc' | 'desc';
}

export const auditApi = {
  getEntityLogs: (entityType: string, entityId: string, params: AuditLogParams = {}) =>
    get<CursorPaginatedResponse<AuditLogItem>>(`/audit-logs/entity/${entityType}/${entityId}${buildQueryString(params as Record<string, unknown>)}`),

  getList: (params: AuditLogParams = {}) =>
    get<CursorPaginatedResponse<AuditLogItem>>(`/audit-logs${buildQueryString(params as Record<string, unknown>)}`),
};

// ---------------------------------------------------------------------------
// Employee Document Upload API (tenant scope)
// ---------------------------------------------------------------------------

export const employeeDocumentsApi = {
  uploadForEmployee: (data: { file: File; employeeId: string; documentCategoryId: string; issuedAt?: string; expiryDate?: string }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('employeeId', data.employeeId);
    formData.append('documentCategoryId', data.documentCategoryId);
    if (data.issuedAt) formData.append('issuedAt', data.issuedAt);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    return uploadFile<MutationResponse<{ id: string; publicId: string; fileKey: string; fileName: string; status: string }>>('/documents/upload', formData);
  },
};

// ---------------------------------------------------------------------------
// Super Admin RBAC API
// ---------------------------------------------------------------------------

export interface PlatformTenant {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface PlatformPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  menuKey: string;
  menuLabel: string;
  actionLabel: string;
  explanation: string;
}

export interface PlatformPermissionModule {
  key: string;
  label: string;
  permissions: PlatformPermission[];
}

export interface PlatformRole {
  id: string;
  tenantId: string | null;
  tenantName: string;
  code: string;
  name: string;
  description?: string | null;
  roleType: string;
  isSystem: boolean;
  assignedUsersCount: number;
  permissions: PlatformPermission[];
  permissionIds: string[];
}

export interface PlatformUserMembership {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  employeeId?: string | null;
  membershipStatus: string;
  userId: string;
  email: string;
  userStatus: string;
  isPlatformAdmin: boolean;
  roles: Array<{ id: string; code: string; name: string; isSystem: boolean }>;
  roleIds: string[];
}

export interface PlatformRolePayload {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface PlatformRoleUpdatePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface PlatformPermissionPayload {
  code: string;
  name: string;
  module: string;
}

export interface PlatformPermissionUpdatePayload {
  name?: string;
  module?: string;
}

export interface PlatformMembershipRolePayload {
  roleIds: string[];
  status?: string;
}

export const platformRbacApi = {
  getTenants: () =>
    get<{ data: PlatformTenant[] }>('/super-admin/rbac/tenants'),

  getPermissions: (params: ListQueryParams & { module?: string } = {}) =>
    get<StandardListResponse<PlatformPermission>>(`/super-admin/rbac/permissions${buildQueryString(params as Record<string, unknown>)}`),

  getPermissionCatalog: () =>
    get<StandardDetailResponse<{ permissions: PlatformPermission[]; modules: PlatformPermissionModule[] }>>('/super-admin/rbac/permission-catalog'),

  createPermission: (payload: PlatformPermissionPayload) =>
    post<PlatformPermissionPayload, MutationResponse<PlatformPermission>>('/super-admin/rbac/permissions', payload),

  updatePermission: (id: string, payload: PlatformPermissionUpdatePayload) =>
    patch<PlatformPermissionUpdatePayload, MutationResponse<PlatformPermission>>(`/super-admin/rbac/permissions/${id}`, payload),

  deletePermission: (id: string) =>
    del<MutationResponse>(`/super-admin/rbac/permissions/${id}`),

  getRoles: (params: ListQueryParams & { tenantId?: string } = {}) =>
    get<StandardListResponse<PlatformRole>>(`/super-admin/rbac/roles${buildQueryString(params as Record<string, unknown>)}`),

  createRole: (payload: PlatformRolePayload) =>
    post<PlatformRolePayload, MutationResponse<{ id: string }>>('/super-admin/rbac/roles', payload),

  updateRole: (id: string, payload: PlatformRoleUpdatePayload) =>
    patch<PlatformRoleUpdatePayload, MutationResponse>(`/super-admin/rbac/roles/${id}`, payload),

  deleteRole: (id: string) =>
    del<MutationResponse>(`/super-admin/rbac/roles/${id}`),

  getUsers: (params: ListQueryParams & { tenantId?: string } = {}) =>
    get<StandardListResponse<PlatformUserMembership>>(`/super-admin/rbac/users${buildQueryString(params as Record<string, unknown>)}`),

  updateUserRoles: (membershipId: string, payload: PlatformMembershipRolePayload) =>
    patch<PlatformMembershipRolePayload, MutationResponse>(`/super-admin/rbac/users/${membershipId}/roles`, payload),
};
