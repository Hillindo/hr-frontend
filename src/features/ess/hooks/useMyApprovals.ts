/**
 * Hooks for approval inbox and history
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

export function useApprovalInbox(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.approvals.inbox(params),
    queryFn: () => approvalsApi.getInbox(params),
  });
}

export function useApprovalHistory(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.approvals.history(params),
    queryFn: () => approvalsApi.getHistory(params),
  });
}

export function useApprovalDetail(id: string) {
  return useQuery({
    queryKey: essKeys.approvals.detail(id),
    queryFn: () => approvalsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { note?: string } }) =>
      approvalsApi.approve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.approvals.inbox({}) });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { reason: string } }) =>
      approvalsApi.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.approvals.inbox({}) });
      queryClient.invalidateQueries({ queryKey: essKeys.approvals.history({}) });
    },
  });
}

export function useRequestRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { remarks?: string } }) =>
      approvalsApi.requestRevision(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.approvals.inbox({}) });
      queryClient.invalidateQueries({ queryKey: essKeys.approvals.history({}) });
    },
  });
}