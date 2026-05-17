'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi, CreateBranchPayload, UpdateBranchPayload } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useBranchesQuery(params: ListQueryParams & { companyId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.branches.list(params),
    queryFn: () => branchesApi.getList(params),
  });
}

export function useBranchQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.branches.detail(id),
    queryFn: () => branchesApi.getDetail(id),
    enabled: !!id,
  });
}

export function useBranchMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateBranchPayload) => branchesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.branches.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      branchesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.branches.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleBranchStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      branchesApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.branches.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.branches.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}