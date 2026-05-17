import { ApiError } from '@/lib/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: ApiError | Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function normalizeError(response: Response, body?: ApiError): HttpError {
  let message = `HTTP ${response.status}`;

  if (body?.message) {
    message = body.message;
  } else if (body?.error) {
    message = body.error;
  } else {
    switch (response.status) {
      case 400:
        message = 'Invalid request data';
        break;
      case 401:
        message = 'Authentication required';
        break;
      case 403:
        message = 'Access denied';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 500:
        message = 'Internal server error';
        break;
    }
  }

  return new HttpError(response.status, message, body);
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      setAuthToken(data.accessToken, data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, { ...options, headers });
      if (retryResponse.ok || retryResponse.status === 204) {
        if (retryResponse.status === 204) return {} as T;
        const contentType = retryResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return retryResponse.json();
        }
        return {} as T;
      }
    }

    clearAuthTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new HttpError(401, 'Session expired. Please login again.');
  }

  let body: ApiError | undefined;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    body = await response.json();
  }

  if (!response.ok) {
    throw normalizeError(response, body);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return body as T;
}

export async function get<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, { method: 'GET' });
}

export async function post<T, R = unknown>(endpoint: string, data: T): Promise<R> {
  return fetchApi<R>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patch<T, R = unknown>(endpoint: string, data: T): Promise<R> {
  return fetchApi<R>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function put<T, R = unknown>(endpoint: string, data?: T): Promise<R> {
  return fetchApi<R>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function del<R = unknown>(endpoint: string): Promise<R> {
  return fetchApi<R>(endpoint, { method: 'DELETE' });
}

export async function uploadFile<R = unknown>(
  endpoint: string,
  formData: FormData,
): Promise<R> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, { method: 'POST', headers, body: formData });
      if (retryResponse.ok || retryResponse.status === 204) {
        if (retryResponse.status === 204) return {} as R;
        const contentType = retryResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return retryResponse.json();
        }
        return {} as R;
      }
    }

    clearAuthTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new HttpError(401, 'Session expired. Please login again.');
  }

  let body: ApiError | undefined;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    body = await response.json();
  }

  if (!response.ok) {
    throw normalizeError(response, body);
  }

  if (response.status === 204) {
    return {} as R;
  }

  return body as R;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    status: string;
  };
  activeTenant?: {
    id: string;
    name: string;
    status: string;
  };
  activeMembership?: {
    id: string;
    status: string;
    employeeId: string;
    roleCodes: string[];
  };
  tenantContext?: {
    tenantId: string;
    membershipId?: string;
    employeeId?: string;
    roleCodes: string[];
    permissionCodes: string[];
  };
  isPlatformAdmin?: boolean;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    status: string;
    isPlatformAdmin?: boolean;
  };
  activeTenant?: {
    id: string;
    name: string;
    status: string;
    subscriptionStatus?: string;
  };
  activeMembership?: {
    id: string;
    status: string;
    employeeId: string;
    roleCodes: string[];
  };
  availableTenants: Array<{
    tenantId: string;
    tenantName: string;
    membershipId: string;
    status: string;
  }>;
  isPlatformAdmin?: boolean;
  tenantContext?: {
    tenantId: string;
    membershipId?: string;
    employeeId?: string;
    roleCodes: string[];
    permissionCodes: string[];
  };
}

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  clearAuthTokens();
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = 'Login failed';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {}
    throw new HttpError(response.status, message);
  }

  const result = await response.json();
  if (result.accessToken) {
    setAuthToken(result.accessToken, result.refreshToken);
  }
  return result;
}

export async function getMe(): Promise<MeResponse> {
  return get<MeResponse>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  try {
    const token = getAuthToken();
    const refreshToken = getRefreshToken();
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
  } finally {
    clearAuthTokens();
  }
}
