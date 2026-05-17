/**
 * Hooks for employee leave data
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

export function useMyLeaveTypes() {
  return useQuery({
    queryKey: essKeys.leave.types(),
    queryFn: () => leaveApi.getTypes(),
  });
}

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: essKeys.leave.balances(),
    queryFn: () => leaveApi.getBalances(),
  });
}

export function useMyLeaveRequests(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.leave.requests(params),
    queryFn: () => leaveApi.getRequests(params),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ess', 'leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: essKeys.leave.balances() });
      queryClient.invalidateQueries({ queryKey: ['ess', 'requests'] });
      queryClient.invalidateQueries({ queryKey: essKeys.home() });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ess', 'leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: essKeys.leave.balances() });
      queryClient.invalidateQueries({ queryKey: ['ess', 'requests'] });
      queryClient.invalidateQueries({ queryKey: essKeys.home() });
    },
  });
}
