import type { ListQueryParams } from '@/lib/types/api';

export const queryKeys = {
  masterData: {
    companies: {
      all: () => ['masterData', 'companies'] as const,
      list: (params: ListQueryParams) => ['masterData', 'companies', 'list', params] as const,
      detail: (id: string) => ['masterData', 'companies', 'detail', id] as const,
    },
    branches: {
      all: () => ['masterData', 'branches'] as const,
      list: (params: ListQueryParams & { companyId?: string }) =>
        ['masterData', 'branches', 'list', params] as const,
      detail: (id: string) => ['masterData', 'branches', 'detail', id] as const,
    },
    divisions: {
      all: () => ['masterData', 'divisions'] as const,
      list: (params: ListQueryParams & { companyId?: string }) =>
        ['masterData', 'divisions', 'list', params] as const,
      detail: (id: string) => ['masterData', 'divisions', 'detail', id] as const,
    },
    departments: {
      all: () => ['masterData', 'departments'] as const,
      list: (params: ListQueryParams & { divisionId?: string }) =>
        ['masterData', 'departments', 'list', params] as const,
      detail: (id: string) => ['masterData', 'departments', 'detail', id] as const,
    },
    positions: {
      all: () => ['masterData', 'positions'] as const,
      list: (params: ListQueryParams & { grade?: string }) =>
        ['masterData', 'positions', 'list', params] as const,
      detail: (id: string) => ['masterData', 'positions', 'detail', id] as const,
    },
    shifts: {
      all: () => ['masterData', 'shifts'] as const,
      list: (params: ListQueryParams & { isActive?: string }) =>
        ['masterData', 'shifts', 'list', params] as const,
      detail: (id: string) => ['masterData', 'shifts', 'detail', id] as const,
    },
    leaveTypes: {
      all: () => ['masterData', 'leaveTypes'] as const,
      list: (params: ListQueryParams & { deductBalance?: string }) =>
        ['masterData', 'leaveTypes', 'list', params] as const,
      detail: (id: string) => ['masterData', 'leaveTypes', 'detail', id] as const,
    },
    documentCategories: {
      all: () => ['masterData', 'documentCategories'] as const,
      list: (params: ListQueryParams & { isMandatory?: string }) =>
        ['masterData', 'documentCategories', 'list', params] as const,
      detail: (id: string) => ['masterData', 'documentCategories', 'detail', id] as const,
    },
  },
} as const;

export type ESSQueryParams = ListQueryParams;

export const essKeys = {
  home: () => ['ess', 'home'] as const,
  attendance: {
    today: () => ['ess', 'attendance', 'today'] as const,
    history: (params: ESSQueryParams) => ['ess', 'attendance', 'history', params] as const,
    corrections: (params: ESSQueryParams) => ['ess', 'attendance', 'corrections', params] as const,
  },
  leave: {
    types: () => ['ess', 'leave', 'types'] as const,
    balances: () => ['ess', 'leave', 'balances'] as const,
    requests: (params: ESSQueryParams) => ['ess', 'leave', 'requests', params] as const,
  },
  requests: {
    list: (params: ESSQueryParams) => ['ess', 'requests', 'list', params] as const,
  },
  profile: {
    me: () => ['ess', 'profile', 'me'] as const,
  },
  documents: {
    me: (params: ESSQueryParams) => ['ess', 'documents', 'me', params] as const,
    missing: (params: ESSQueryParams) => ['ess', 'documents', 'missing', params] as const,
    expiring: (params: ESSQueryParams) => ['ess', 'documents', 'expiring', params] as const,
  },
  notifications: {
    unreadCount: () => ['ess', 'notifications', 'unreadCount'] as const,
  },
  approvals: {
    inbox: (params: ESSQueryParams) => ['ess', 'approvals', 'inbox', params] as const,
    history: (params: ESSQueryParams) => ['ess', 'approvals', 'history', params] as const,
    detail: (id: string) => ['ess', 'approvals', 'detail', id] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Admin / HR scopes
// ---------------------------------------------------------------------------

export type AdminQueryParams = ListQueryParams & Record<string, unknown>;

export const adminKeys = {
  platformRbac: {
    all: () => ['admin', 'platformRbac'] as const,
    tenants: () => ['admin', 'platformRbac', 'tenants'] as const,
    permissionCatalog: () => ['admin', 'platformRbac', 'permissionCatalog'] as const,
    permissions: (params: AdminQueryParams) => ['admin', 'platformRbac', 'permissions', params] as const,
    roles: (params: AdminQueryParams) => ['admin', 'platformRbac', 'roles', params] as const,
    users: (params: AdminQueryParams) => ['admin', 'platformRbac', 'users', params] as const,
  },
  dashboard: {
    hr: (params?: AdminQueryParams) => ['admin', 'dashboard', 'hr', params] as const,
    manager: (params?: AdminQueryParams) => ['admin', 'dashboard', 'manager', params] as const,
  },
  attendance: {
    list: (params: AdminQueryParams) => ['admin', 'attendance', 'list', params] as const,
    team: (params: AdminQueryParams) => ['admin', 'attendance', 'team', params] as const,
    summary: (params?: AdminQueryParams) => ['admin', 'attendance', 'summary', params] as const,
    teamSummary: (params?: AdminQueryParams) => ['admin', 'attendance', 'teamSummary', params] as const,
    corrections: (params: AdminQueryParams) => ['admin', 'attendance', 'corrections', params] as const,
  },
  documents: {
    list: (params: AdminQueryParams) => ['admin', 'documents', 'list', params] as const,
    expiring: (params: AdminQueryParams) => ['admin', 'documents', 'expiring', params] as const,
    missing: (params: AdminQueryParams) => ['admin', 'documents', 'missing', params] as const,
    categories: () => ['admin', 'documents', 'categories'] as const,
  },
  leave: {
    team: (params: AdminQueryParams) => ['admin', 'leave', 'team', params] as const,
    tenant: (params: AdminQueryParams) => ['admin', 'leave', 'tenant', params] as const,
    tenantBalances: (params: AdminQueryParams) => ['admin', 'leave', 'tenantBalances', params] as const,
    types: () => ['admin', 'leave', 'types'] as const,
  },
  employees: {
    list: (params: AdminQueryParams) => ['admin', 'employees', 'list', params] as const,
    detail: (id: string) => ['admin', 'employees', 'detail', id] as const,
    directReports: () => ['admin', 'employees', 'directReports'] as const,
  },
  schedules: {
    list: (params: AdminQueryParams) => ['admin', 'schedules', 'list', params] as const,
    self: (params: AdminQueryParams) => ['admin', 'schedules', 'self', params] as const,
  },
  notifications: {
    list: (params: AdminQueryParams) => ['admin', 'notifications', 'list', params] as const,
  },
  payroll: {
    runs: (params?: AdminQueryParams) => ['admin', 'payroll', 'runs', params] as const,
    run: (id: string) => ['admin', 'payroll', 'run', id] as const,
    preview: (params?: AdminQueryParams) => ['admin', 'payroll', 'preview', params] as const,
    anomalies: (params?: AdminQueryParams) => ['admin', 'payroll', 'anomalies', params] as const,
    salaryGroups: (params?: AdminQueryParams) => ['admin', 'payroll', 'salaryGroups', params] as const,
    deductionTypes: (params?: AdminQueryParams) => ['admin', 'payroll', 'deductionTypes', params] as const,
  },
  audit: {
    entityLogs: (entityType: string, entityId: string, params: AdminQueryParams = {}) => ['admin', 'audit', 'entity', entityType, entityId, params] as const,
    list: (params: AdminQueryParams = {}) => ['admin', 'audit', 'list', params] as const,
  },
  employeeDocuments: {
    list: (params: AdminQueryParams) => ['admin', 'employeeDocuments', 'list', params] as const,
    categories: () => ['admin', 'employeeDocuments', 'categories'] as const,
  },
} as const;
