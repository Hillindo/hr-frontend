'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveTypesApi, CreateLeaveTypePayload, LeaveTypeListParams, UpdateLeaveTypePayload } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useLeaveTypesQuery(params: ListQueryParams & { deductBalance?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.leaveTypes.list(params),
    queryFn: () => leaveTypesApi.getList(params),
  });
}

export function useLeaveTypeQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.leaveTypes.detail(id),
    queryFn: () => leaveTypesApi.getDetail(id),
    enabled: !!id,
  });
}

export function useLeaveTypeMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateLeaveTypePayload) => leaveTypesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.leaveTypes.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeaveTypePayload }) =>
      leaveTypesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.leaveTypes.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleLeaveTypeStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      leaveTypesApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.leaveTypes.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.leaveTypes.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}