/**
 * Hook for fetching ESS home data
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { essApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';

export function useHomeData() {
  return useQuery({
    queryKey: essKeys.home(),
    queryFn: () => essApi.getHome(),
  });
}