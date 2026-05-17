'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi, CreateShiftPayload, UpdateShiftPayload, ShiftListParams } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useShiftsQuery(params: ListQueryParams & { isActive?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.shifts.list(params),
    queryFn: () => shiftsApi.getList(params),
  });
}

export function useShiftQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.shifts.detail(id),
    queryFn: () => shiftsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useShiftMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateShiftPayload) => shiftsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.shifts.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShiftPayload }) =>
      shiftsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.shifts.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleShiftStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: RecordStatus }) =>
      shiftsApi.toggleStatus(id, { isActive }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.shifts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.shifts.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}