// Types for HR System Frontend

export type UserRole = 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type EmploymentStatus = 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'PROBATION' | 'CONTRACT';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'INTERN' | 'PART_TIME' | 'FREELANCE';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'SICK' | 'PERMISSION' | 'HOLIDAY' | 'WEEKEND';
export type AttendanceSource = 'SELF_SERVICE' | 'IMPORT' | 'HR_ASSISTED' | 'SYSTEM';

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'CANCELLED';

export type DocumentStatus = 'VALID' | 'NEAR_EXPIRY' | 'EXPIRED' | 'MISSING';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  nik?: string;
  npwp?: string;
  maritalStatus?: string;
  companyId: string;
  companyName: string;
  branchId: string;
  branchName: string;
  divisionId: string;
  divisionName: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  managerId?: string;
  managerName?: string;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  joinDate: string;
  endDate?: string;
  // Contact & Address
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  profileCompleteness: number;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  workDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  lateMinutes: number;
  source: AttendanceSource;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  requestId: string;
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
  status: RequestStatus;
  approverName?: string;
  submittedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface ApprovalRequest {
  id: string;
  requestId: string;
  entityType: 'LEAVE_REQUEST' | 'ATTENDANCE_CORRECTION' | 'PROFILE_CHANGE';
  requesterEmployeeId: string;
  requesterName: string;
  requesterDepartment: string;
  currentStepOrder: number;
  currentStepName: string;
  finalStatus: RequestStatus;
  submittedAt: string;
  resolvedAt?: string;
  summary: string;
}

export interface Document {
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
  status: DocumentStatus;
  uploadedByName: string;
}

export interface DashboardCard {
  title: string;
  value: number;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
  urgent?: boolean;
  icon?: string;
}

export interface OrganizationData {
  branches: { id: string; name: string; city?: string }[];
  divisions: { id: string; name: string }[];
  departments: { id: string; name: string; divisionId: string }[];
  positions: { id: string; name: string; grade?: number }[];
}

export interface PayrollPreviewRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  unpaidLeaveDays: number;
  sickDays: number;
  permissionDays: number;
  totalDays: number;
  anomalies: string[];
  profileComplete: boolean;
}