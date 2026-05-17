'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi, CreateDivisionPayload, UpdateDivisionPayload } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useDivisionsQuery(params: ListQueryParams & { companyId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.divisions.list(params),
    queryFn: () => divisionsApi.getList(params),
  });
}

export function useDivisionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.divisions.detail(id),
    queryFn: () => divisionsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useDivisionMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDivisionPayload) => divisionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.divisions.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDivisionPayload }) =>
      divisionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.divisions.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleDivisionStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      divisionsApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.divisions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.divisions.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}