'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useDepartmentsQuery(params: ListQueryParams & { divisionId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.departments.list(params),
    queryFn: () => departmentsApi.getList(params),
  });
}

export function useDepartmentQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.departments.detail(id),
    queryFn: () => departmentsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useDepartmentMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.departments.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      departmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.departments.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleDepartmentStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      departmentsApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.departments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.departments.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}