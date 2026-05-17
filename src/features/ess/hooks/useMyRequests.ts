/**
 * Hooks for employee requests (leave, attendance corrections, etc.)
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { essApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

export function useMyRequests(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.requests.list(params),
    queryFn: () => essApi.getMyRequests(params),
  });
}