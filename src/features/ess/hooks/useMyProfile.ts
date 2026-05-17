/**
 * Hooks for employee profile
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';

export function useMyProfile() {
  return useQuery({
    queryKey: essKeys.profile.me(),
    queryFn: () => profileApi.getMe(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.profile.me() });
    },
  });
}