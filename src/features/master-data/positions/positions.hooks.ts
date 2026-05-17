'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsApi, CreatePositionPayload, UpdatePositionPayload, PositionListParams } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function usePositionsQuery(params: ListQueryParams & { grade?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.positions.list(params),
    queryFn: () => positionsApi.getList(params),
  });
}

export function usePositionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.positions.detail(id),
    queryFn: () => positionsApi.getDetail(id),
    enabled: !!id,
  });
}

export function usePositionMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreatePositionPayload) => positionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.positions.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePositionPayload }) =>
      positionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.positions.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useTogglePositionStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      positionsApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.positions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.positions.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}