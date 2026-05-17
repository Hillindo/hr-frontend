/**
 * Hooks for notifications
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: essKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.notifications.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.notifications.unreadCount() });
    },
  });
}