'use client';

import { useQuery, useMutation, useQueryClient, type PlaceholderDataFunction } from '@tanstack/react-query';
import {
  dashboardApi,
  attendanceAdminApi,
  documentsAdminApi,
  leaveAdminApi,
  employeesApi,
  schedulesApi,
  notificationsListApi,
  payrollSupportApi,
  salaryGroupsApi,
  deductionTypesApi,
  auditApi,
  employeeDocumentsApi,
  platformRbacApi,
} from '@/lib/api/admin';
import type {
  PlatformMembershipRolePayload,
  PlatformPermissionUpdatePayload,
  PlatformRoleUpdatePayload,
  UpdateEmployeePayload,
} from '@/lib/api/admin';
import { adminKeys, essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

interface AdminListHookOptions<TData> {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  placeholderData?: PlaceholderDataFunction<TData>;
}

// ---------------------------------------------------------------------------
// Dashboard Hooks
// ---------------------------------------------------------------------------

export function useHrDashboard(params?: ListQueryParams) {
  return useQuery({
    queryKey: adminKeys.dashboard.hr(params as Record<string, unknown>),
    queryFn: () => dashboardApi.getHr(params),
  });
}

export function useManagerDashboard(params?: ListQueryParams) {
  return useQuery({
    queryKey: adminKeys.dashboard.manager(params as Record<string, unknown>),
    queryFn: () => dashboardApi.getManager(params),
  });
}

// ---------------------------------------------------------------------------
// Attendance Admin Hooks
// ---------------------------------------------------------------------------

export function useAttendanceList(
  params: Record<string, unknown> = {},
  options?: AdminListHookOptions<Awaited<ReturnType<typeof attendanceAdminApi.getList>>>,
) {
  return useQuery({
    queryKey: adminKeys.attendance.list(params),
    queryFn: () => attendanceAdminApi.getList(params),
    staleTime: options?.staleTime ?? 30_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

export function useTeamAttendance(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.attendance.team(params),
    queryFn: () => attendanceAdminApi.getTeam(params),
  });
}

export function useAttendanceSummary(
  params?: Record<string, unknown>,
  options?: AdminListHookOptions<Awaited<ReturnType<typeof attendanceAdminApi.getSummary>>>,
) {
  return useQuery({
    queryKey: adminKeys.attendance.summary(params),
    queryFn: () => attendanceAdminApi.getSummary(params),
    staleTime: options?.staleTime ?? 30_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

export function useTeamAttendanceSummary(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminKeys.attendance.teamSummary(params),
    queryFn: () => attendanceAdminApi.getTeamSummary(params),
  });
}

export function useAttendanceCorrections(
  params: Record<string, unknown> = {},
  options?: AdminListHookOptions<Awaited<ReturnType<typeof attendanceAdminApi.getCorrections>>>,
) {
  return useQuery({
    queryKey: adminKeys.attendance.corrections(params),
    queryFn: () => attendanceAdminApi.getCorrections(params),
    staleTime: options?.staleTime ?? 60_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

export function useCreateAssistedAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceAdminApi.createAssisted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.attendance.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.attendance.summary() });
    },
  });
}

// ---------------------------------------------------------------------------
// Documents Admin Hooks
// ---------------------------------------------------------------------------

export function useDocumentsList(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.documents.list(params),
    queryFn: () => documentsAdminApi.getList(params),
  });
}

export function useExpiringDocuments(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.documents.expiring(params),
    queryFn: () => documentsAdminApi.getExpiring(params),
  });
}

export function useMissingDocuments(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.documents.missing(params),
    queryFn: () => documentsAdminApi.getMissing(params),
  });
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: adminKeys.documents.categories(),
    queryFn: () => documentsAdminApi.getCategories(),
  });
}

// ---------------------------------------------------------------------------
// Leave Admin Hooks
// ---------------------------------------------------------------------------

export function useTeamLeaveRequests(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.leave.team(params),
    queryFn: () => leaveAdminApi.getTeamRequests(params),
  });
}

export function useTenantLeaveRequests(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.leave.tenant(params),
    queryFn: () => leaveAdminApi.getTenantRequests(params),
  });
}

export function useTenantLeaveBalances(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.leave.tenantBalances(params),
    queryFn: () => leaveAdminApi.getTenantBalances(params),
  });
}

export function useLeaveTypesAdmin() {
  return useQuery({
    queryKey: adminKeys.leave.types(),
    queryFn: () => leaveAdminApi.getTypes(),
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveAdminApi.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.leave.team({}) });
      queryClient.invalidateQueries({ queryKey: essKeys.leave.requests({}) });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      leaveAdminApi.rejectRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.leave.team({}) });
      queryClient.invalidateQueries({ queryKey: essKeys.leave.requests({}) });
    },
  });
}

// ---------------------------------------------------------------------------
// Employees Admin Hooks
// ---------------------------------------------------------------------------

export function useEmployeeList(
  params: Record<string, unknown> = {},
  options?: AdminListHookOptions<Awaited<ReturnType<typeof employeesApi.getList>>>,
) {
  return useQuery({
    queryKey: adminKeys.employees.list(params),
    queryFn: () => employeesApi.getList(params),
    staleTime: options?.staleTime ?? 60_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

export function useEmployeeDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.employees.detail(id),
    queryFn: () => employeesApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.employees.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.employees.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.employees.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.audit.entityLogs('EMPLOYEE', variables.id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Payroll Config Hooks (Salary Groups & Deduction Types)
// ---------------------------------------------------------------------------

export function useSalaryGroups(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.payroll.salaryGroups(params),
    queryFn: () => salaryGroupsApi.getList(params),
  });
}

export function useCreateSalaryGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salaryGroupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.salaryGroups({}) });
    },
  });
}

export function useUpdateSalaryGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof salaryGroupsApi.update>[1] }) =>
      salaryGroupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.salaryGroups({}) });
    },
  });
}

export function useDeleteSalaryGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salaryGroupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.salaryGroups({}) });
    },
  });
}

export function useDeductionTypes(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.payroll.deductionTypes(params),
    queryFn: () => deductionTypesApi.getList(params),
  });
}

export function useCreateDeductionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deductionTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.deductionTypes({}) });
    },
  });
}

export function useUpdateDeductionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof deductionTypesApi.update>[1] }) =>
      deductionTypesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.deductionTypes({}) });
    },
  });
}

export function useDeleteDeductionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deductionTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.deductionTypes({}) });
    },
  });
}

export function useDirectReports(
  options?: AdminListHookOptions<Awaited<ReturnType<typeof employeesApi.getDirectReports>>>,
) {
  return useQuery({
    queryKey: adminKeys.employees.directReports(),
    queryFn: () => employeesApi.getDirectReports(),
    staleTime: options?.staleTime ?? 60_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

// ---------------------------------------------------------------------------
// Schedule Hooks
// ---------------------------------------------------------------------------

export function useScheduleList(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.schedules.list(params),
    queryFn: () => schedulesApi.getList(params),
  });
}

export function useSelfSchedule(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.schedules.self(params),
    queryFn: () => schedulesApi.getSelf(params),
  });
}

export function useAssignSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulesApi.assign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.schedules.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.schedules.self({}) });
    },
  });
}

export function useBulkAssignSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulesApi.bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.schedules.list({}) });
    },
  });
}

export function usePublishSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulesApi.publish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.schedules.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.schedules.self({}) });
    },
  });
}

// ---------------------------------------------------------------------------
// Notifications List Hooks
// ---------------------------------------------------------------------------

export function useNotificationsList(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.notifications.list(params),
    queryFn: () => notificationsListApi.getList(params),
  });
}

// ---------------------------------------------------------------------------
// Payroll Support Hooks
// ---------------------------------------------------------------------------

export function usePayrollPreview(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminKeys.payroll.preview(params),
    queryFn: () => payrollSupportApi.getPreview(params),
  });
}

export function usePayrollAnomalies(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: adminKeys.payroll.anomalies(params),
    queryFn: () => payrollSupportApi.getAnomalies(params),
  });
}

export function usePayrollRuns(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.payroll.runs(params),
    queryFn: () => payrollSupportApi.getRuns(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function usePayrollRun(id?: string) {
  return useQuery({
    queryKey: adminKeys.payroll.run(id || ''),
    queryFn: () => payrollSupportApi.getRun(id || ''),
    enabled: !!id,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollSupportApi.createRun,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.runs({}) });
      const runId = response.data?.id;
      if (runId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.payroll.run(runId) });
      }
    },
  });
}

export function useUpdatePayrollRunItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      itemId,
      payload,
    }: {
      runId: string;
      itemId: string;
      payload: Parameters<typeof payrollSupportApi.updateRunItem>[2];
    }) => payrollSupportApi.updateRunItem(runId, itemId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.runs({}) });
      const runId = response.data?.id;
      if (runId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.payroll.run(runId) });
      }
    },
  });
}

export function useUpdatePayrollRunStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof payrollSupportApi.updateRunStatus>[1];
    }) => payrollSupportApi.updateRunStatus(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.runs({}) });
      const runId = response.data?.id;
      if (runId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.payroll.run(runId) });
      }
    },
  });
}

export function useMarkPayrollReadyForPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, reason }: { id: string; notes?: string; reason?: string }) =>
      payrollSupportApi.markReadyForPayment(id, { notes, reason }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll.runs({}) });
      const runId = response.data?.id;
      if (runId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.payroll.run(runId) });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Audit Trail Hooks
// ---------------------------------------------------------------------------

export function useEntityAuditLogs(entityType: string, entityId: string, params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.audit.entityLogs(entityType, entityId, params),
    queryFn: () => auditApi.getEntityLogs(entityType, entityId, params),
    enabled: !!entityType && !!entityId,
  });
}

export function useAuditLogList(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: adminKeys.audit.list(params),
    queryFn: () => auditApi.getList(params),
  });
}

// ---------------------------------------------------------------------------
// Employee Document Upload Hook
// ---------------------------------------------------------------------------

export function useUploadEmployeeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeeDocumentsApi.uploadForEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.documents.list({}) });
      queryClient.invalidateQueries({ queryKey: adminKeys.employeeDocuments.list({}) });
    },
  });
}

// ---------------------------------------------------------------------------
// Super Admin RBAC Hooks
// ---------------------------------------------------------------------------

export function usePlatformTenants(
  options?: Pick<AdminListHookOptions<Awaited<ReturnType<typeof platformRbacApi.getTenants>>>, 'enabled'>,
) {
  return useQuery({
    queryKey: adminKeys.platformRbac.tenants(),
    queryFn: platformRbacApi.getTenants,
    enabled: options?.enabled,
  });
}

export function usePlatformPermissionCatalog(
  options?: Pick<AdminListHookOptions<Awaited<ReturnType<typeof platformRbacApi.getPermissionCatalog>>>, 'enabled'>,
) {
  return useQuery({
    queryKey: adminKeys.platformRbac.permissionCatalog(),
    queryFn: platformRbacApi.getPermissionCatalog,
    enabled: options?.enabled,
  });
}

export function usePlatformPermissions(
  params: Record<string, unknown> = {},
  options?: Pick<AdminListHookOptions<Awaited<ReturnType<typeof platformRbacApi.getPermissions>>>, 'enabled'>,
) {
  return useQuery({
    queryKey: adminKeys.platformRbac.permissions(params),
    queryFn: () => platformRbacApi.getPermissions(params),
    enabled: options?.enabled,
  });
}

export function usePlatformRoles(
  params: Record<string, unknown> = {},
  options?: Pick<AdminListHookOptions<Awaited<ReturnType<typeof platformRbacApi.getRoles>>>, 'enabled'>,
) {
  return useQuery({
    queryKey: adminKeys.platformRbac.roles(params),
    queryFn: () => platformRbacApi.getRoles(params),
    enabled: (options?.enabled ?? true) && !!params.tenantId,
  });
}

export function usePlatformUsers(
  params: Record<string, unknown> = {},
  options?: Pick<AdminListHookOptions<Awaited<ReturnType<typeof platformRbacApi.getUsers>>>, 'enabled'>,
) {
  return useQuery({
    queryKey: adminKeys.platformRbac.users(params),
    queryFn: () => platformRbacApi.getUsers(params),
    enabled: (options?.enabled ?? true) && !!params.tenantId,
  });
}

export function useCreatePlatformPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: platformRbacApi.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useUpdatePlatformPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PlatformPermissionUpdatePayload }) =>
      platformRbacApi.updatePermission(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useDeletePlatformPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: platformRbacApi.deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useCreatePlatformRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: platformRbacApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useUpdatePlatformRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PlatformRoleUpdatePayload }) =>
      platformRbacApi.updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useDeletePlatformRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: platformRbacApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}

export function useUpdatePlatformUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, payload }: { membershipId: string; payload: PlatformMembershipRolePayload }) =>
      platformRbacApi.updateUserRoles(membershipId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformRbac.all() });
    },
  });
}
