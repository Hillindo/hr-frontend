import { get, post, patch } from './http';
import { queryKeys } from '@/lib/query/keys';
import type {
  StandardListResponse,
  StandardDetailResponse,
  MutationResponse,
  ListQueryParams,
  RecordStatus,
  StatusTogglePayload,
  ActiveStatusTogglePayload,
} from '@/lib/types/api';

const MASTER_DATA_BASE = '/master-data';

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export interface CompanyResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  code: string;
  name: string;
  description?: string;
  status?: RecordStatus;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  status?: RecordStatus;
}

export const companiesApi = {
  getList: (params: ListQueryParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/companies${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<CompanyResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<CompanyResponse>>(`${MASTER_DATA_BASE}/companies/${id}`),

  create: (payload: CreateCompanyPayload) =>
    post<CreateCompanyPayload, MutationResponse<CompanyResponse>>(
      `${MASTER_DATA_BASE}/companies`,
      payload
    ),

  update: (id: string, payload: UpdateCompanyPayload) =>
    patch<UpdateCompanyPayload, MutationResponse<CompanyResponse>>(
      `${MASTER_DATA_BASE}/companies/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<CompanyResponse>>(
      `${MASTER_DATA_BASE}/companies/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export interface BranchResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  companyId: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  code: string;
  name: string;
  companyId: string;
  description?: string;
  status?: RecordStatus;
}

export interface UpdateBranchPayload {
  name?: string;
  description?: string;
  status?: RecordStatus;
}

export const branchesApi = {
  getList: (params: ListQueryParams & { companyId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.companyId) searchParams.set('companyId', params.companyId);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/branches${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<BranchResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<BranchResponse>>(`${MASTER_DATA_BASE}/branches/${id}`),

  create: (payload: CreateBranchPayload) =>
    post<CreateBranchPayload, MutationResponse<BranchResponse>>(
      `${MASTER_DATA_BASE}/branches`,
      payload
    ),

  update: (id: string, payload: UpdateBranchPayload) =>
    patch<UpdateBranchPayload, MutationResponse<BranchResponse>>(
      `${MASTER_DATA_BASE}/branches/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<BranchResponse>>(
      `${MASTER_DATA_BASE}/branches/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Divisions
// ---------------------------------------------------------------------------

export interface DivisionResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  companyId: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDivisionPayload {
  code: string;
  name: string;
  companyId: string;
  description?: string;
  status?: RecordStatus;
}

export interface UpdateDivisionPayload {
  name?: string;
  description?: string;
  status?: RecordStatus;
}

export const divisionsApi = {
  getList: (params: ListQueryParams & { companyId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.companyId) searchParams.set('companyId', params.companyId);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/divisions${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<DivisionResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<DivisionResponse>>(`${MASTER_DATA_BASE}/divisions/${id}`),

  create: (payload: CreateDivisionPayload) =>
    post<CreateDivisionPayload, MutationResponse<DivisionResponse>>(
      `${MASTER_DATA_BASE}/divisions`,
      payload
    ),

  update: (id: string, payload: UpdateDivisionPayload) =>
    patch<UpdateDivisionPayload, MutationResponse<DivisionResponse>>(
      `${MASTER_DATA_BASE}/divisions/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<DivisionResponse>>(
      `${MASTER_DATA_BASE}/divisions/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export interface DepartmentResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  divisionId: string;
  divisionName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  divisionId: string;
  description?: string;
  status?: RecordStatus;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  status?: RecordStatus;
}

export const departmentsApi = {
  getList: (params: ListQueryParams & { divisionId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.divisionId) searchParams.set('divisionId', params.divisionId);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/departments${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<DepartmentResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<DepartmentResponse>>(`${MASTER_DATA_BASE}/departments/${id}`),

  create: (payload: CreateDepartmentPayload) =>
    post<CreateDepartmentPayload, MutationResponse<DepartmentResponse>>(
      `${MASTER_DATA_BASE}/departments`,
      payload
    ),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    patch<UpdateDepartmentPayload, MutationResponse<DepartmentResponse>>(
      `${MASTER_DATA_BASE}/departments/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<DepartmentResponse>>(
      `${MASTER_DATA_BASE}/departments/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export interface PositionResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  grade?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionPayload {
  code: string;
  name: string;
  grade?: string;
  description?: string;
  status?: RecordStatus;
}

export interface UpdatePositionPayload {
  name?: string;
  grade?: string;
  description?: string;
  status?: RecordStatus;
}

export interface PositionListParams extends ListQueryParams {
  grade?: string;
}

export const positionsApi = {
  getList: (params: PositionListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.grade) searchParams.set('grade', params.grade);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/positions${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<PositionResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<PositionResponse>>(`${MASTER_DATA_BASE}/positions/${id}`),

  create: (payload: CreatePositionPayload) =>
    post<CreatePositionPayload, MutationResponse<PositionResponse>>(
      `${MASTER_DATA_BASE}/positions`,
      payload
    ),

  update: (id: string, payload: UpdatePositionPayload) =>
    patch<UpdatePositionPayload, MutationResponse<PositionResponse>>(
      `${MASTER_DATA_BASE}/positions/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<PositionResponse>>(
      `${MASTER_DATA_BASE}/positions/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

export interface ShiftResponse {
  id: string;
  code: string;
  name: string;
  color: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  toleranceLateMinutes: number;
  earlyOutToleranceMinutes?: number | null;
  breakMode: string;
  breakMinutes?: number | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  workDays: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftPayload {
  code: string;
  name: string;
  color?: string;
  description?: string;
  startTime: string;
  endTime: string;
  isOvernight?: boolean;
  toleranceLateMinutes?: number;
  earlyOutToleranceMinutes?: number;
  breakMode?: string;
  breakMinutes?: number;
  breakStartTime?: string;
  breakEndTime?: string;
  workDays?: number[];
  isActive?: boolean;
}

export interface UpdateShiftPayload {
  name?: string;
  color?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  toleranceLateMinutes?: number;
  earlyOutToleranceMinutes?: number;
  breakMode?: string;
  breakMinutes?: number;
  breakStartTime?: string;
  breakEndTime?: string;
  workDays?: number[];
  isActive?: boolean;
}

export interface ShiftListParams extends ListQueryParams {
  isActive?: string;
}

export const shiftsApi = {
  getList: (params: ShiftListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/shifts${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<ShiftResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<ShiftResponse>>(`${MASTER_DATA_BASE}/shifts/${id}`),

  create: (payload: CreateShiftPayload) =>
    post<CreateShiftPayload, MutationResponse<ShiftResponse>>(
      `${MASTER_DATA_BASE}/shifts`,
      payload
    ),

  update: (id: string, payload: UpdateShiftPayload) =>
    patch<UpdateShiftPayload, MutationResponse<ShiftResponse>>(
      `${MASTER_DATA_BASE}/shifts/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: ActiveStatusTogglePayload) =>
    patch<ActiveStatusTogglePayload, MutationResponse<ShiftResponse>>(
      `${MASTER_DATA_BASE}/shifts/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Leave Types
// ---------------------------------------------------------------------------

export interface LeaveTypeResponse {
  id: string;
  code: string;
  name: string;
  deductBalance: boolean;
  requiresAttachment: boolean;
  maxDaysPerRequest?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveTypePayload {
  code: string;
  name: string;
  deductBalance?: boolean;
  requiresAttachment?: boolean;
  maxDaysPerRequest?: number;
  status?: RecordStatus;
}

export interface UpdateLeaveTypePayload {
  name?: string;
  deductBalance?: boolean;
  requiresAttachment?: boolean;
  maxDaysPerRequest?: number;
  status?: RecordStatus;
}

export interface LeaveTypeListParams extends ListQueryParams {
  deductBalance?: string;
}

export const leaveTypesApi = {
  getList: (params: LeaveTypeListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.deductBalance) searchParams.set('deductBalance', params.deductBalance);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/leave-types${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<LeaveTypeResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<LeaveTypeResponse>>(`${MASTER_DATA_BASE}/leave-types/${id}`),

  create: (payload: CreateLeaveTypePayload) =>
    post<CreateLeaveTypePayload, MutationResponse<LeaveTypeResponse>>(
      `${MASTER_DATA_BASE}/leave-types`,
      payload
    ),

  update: (id: string, payload: UpdateLeaveTypePayload) =>
    patch<UpdateLeaveTypePayload, MutationResponse<LeaveTypeResponse>>(
      `${MASTER_DATA_BASE}/leave-types/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: StatusTogglePayload) =>
    patch<StatusTogglePayload, MutationResponse<LeaveTypeResponse>>(
      `${MASTER_DATA_BASE}/leave-types/${id}/status`,
      payload
    ),
};

// ---------------------------------------------------------------------------
// Document Categories
// ---------------------------------------------------------------------------

export interface DocumentCategoryResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  requiresExpiry: boolean;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentCategoryPayload {
  code: string;
  name: string;
  description?: string;
  requiresExpiry?: boolean;
  isMandatory?: boolean;
  isActive?: boolean;
}

export interface UpdateDocumentCategoryPayload {
  name?: string;
  description?: string;
  requiresExpiry?: boolean;
  isMandatory?: boolean;
  isActive?: boolean;
}

export interface DocumentCategoryListParams extends ListQueryParams {
  isMandatory?: string;
}

export const documentCategoriesApi = {
  getList: (params: DocumentCategoryListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.isMandatory) searchParams.set('isMandatory', params.isMandatory);
    const queryString = searchParams.toString();
    const url = `${MASTER_DATA_BASE}/document-categories${queryString ? `?${queryString}` : ''}`;
    return get<StandardListResponse<DocumentCategoryResponse>>(url);
  },

  getDetail: (id: string) =>
    get<StandardDetailResponse<DocumentCategoryResponse>>(
      `${MASTER_DATA_BASE}/document-categories/${id}`
    ),

  create: (payload: CreateDocumentCategoryPayload) =>
    post<CreateDocumentCategoryPayload, MutationResponse<DocumentCategoryResponse>>(
      `${MASTER_DATA_BASE}/document-categories`,
      payload
    ),

  update: (id: string, payload: UpdateDocumentCategoryPayload) =>
    patch<UpdateDocumentCategoryPayload, MutationResponse<DocumentCategoryResponse>>(
      `${MASTER_DATA_BASE}/document-categories/${id}`,
      payload
    ),

  toggleStatus: (id: string, payload: ActiveStatusTogglePayload) =>
    patch<ActiveStatusTogglePayload, MutationResponse<DocumentCategoryResponse>>(
      `${MASTER_DATA_BASE}/document-categories/${id}/status`,
      payload
    ),
};

export const masterDataApi = {
  companies: companiesApi,
  branches: branchesApi,
  divisions: divisionsApi,
  departments: departmentsApi,
  positions: positionsApi,
  shifts: shiftsApi,
  leaveTypes: leaveTypesApi,
  documentCategories: documentCategoriesApi,
} as const;