export type RecordStatus = 'ACTIVE' | 'INACTIVE';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StandardListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface StandardDetailResponse<T> {
  data: T;
}

export interface MutationResponse<T = unknown> {
  data?: T;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  type?: string;
}

export interface StatusTogglePayload {
  status: RecordStatus;
}

export interface ActiveStatusTogglePayload {
  isActive: RecordStatus;
}
